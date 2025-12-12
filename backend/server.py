import os
import logging
from datetime import datetime
from typing import List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware import Middleware
from starlette.middleware.sessions import SessionMiddleware
from pydantic import BaseModel
import asyncio
import requests
from requests.exceptions import Timeout

# Load environment variables from .env file
from dotenv import load_dotenv
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI()

# Add Session Middleware for OAuth
app.add_middleware(SessionMiddleware, secret_key=os.getenv("SESSION_SECRET_KEY", "your-secret-key-change-in-production"))

# CORS middleware
# Get CORS origins from environment variable, with fallback to localhost for development
CORS_ORIGINS = os.getenv("CORS_ORIGINS", f"http://localhost:{os.getenv('FRONTEND_PORT', '5173')},http://localhost:{os.getenv('PORT', '8000')},http://localhost:{os.getenv('ALT_PORT', '3000')}").split(",")
CORS_ORIGINS = [origin.strip() for origin in CORS_ORIGINS if origin.strip()]

# Add https versions of the origins as well for production
HTTPS_CORS_ORIGINS = []
for origin in CORS_ORIGINS:
    if origin.startswith("http://"):
        HTTPS_CORS_ORIGINS.append(origin.replace("http://", "https://"))
    else:
        HTTPS_CORS_ORIGINS.append(origin)

# Combine both http and https origins
ALL_CORS_ORIGINS = list(set(HTTPS_CORS_ORIGINS + CORS_ORIGINS))

# For production, also allow all origins as a fallback
if os.getenv("ENVIRONMENT") == "production":
    ALL_CORS_ORIGINS.append("https://jarvis-l8gx.onrender.com")

# Log the CORS origins for debugging
logger.info(f"CORS origins configured: {ALL_CORS_ORIGINS}")

# Add CORS middleware with more permissive settings for production
# In production, allow all origins to avoid CORS issues
if os.getenv("ENVIRONMENT") == "production":
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # Allow all origins in production
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=ALL_CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        allow_origin_regex="https://.*\\.onrender\\.com",  # Allow all Render subdomains
    )

# Import agents
from backend.agents.chief_agent import ChiefAgent

# Import auth routes
from backend.auth import router as auth_router, mongo_client, users_collection

# Initialize MongoDB collections if client is available
activity_collection = None
if mongo_client is not None:
    try:
        db = mongo_client["jarvis_database"]
        activity_collection = db["activity_logs"]
        # Create indexes for better performance
        activity_collection.create_index("userId")
        activity_collection.create_index("timestamp")
        activity_collection.create_index([("userId", 1), ("timestamp", -1)])
        print("Initialized MongoDB activity collection successfully")
    except Exception as e:
        logger.error(f"Failed to initialize MongoDB activity collection: {e}")
        activity_collection = None

app.include_router(auth_router, prefix="/api")

class ResearchRequest(BaseModel):
    topic: str
    is_deep: bool

class QuestionRequest(BaseModel):
    question: str
    context: str

class DocumentAnalysisRequest(BaseModel):
    file_base64: str
    mime_type: str

class Source(BaseModel):
    title: Optional[str] = None
    uri: str

class ResearchResult(BaseModel):
    report: str
    sources: List[Source]
    images: Optional[List[str]] = None
    
class QuestionResult(BaseModel):
    answer: str

# Pydantic models for LLM
class LLMRequest(BaseModel):
    prompt: str
    system_instruction: Optional[str] = None
    json_mode: Optional[bool] = False
    thinking_budget: Optional[int] = None
    is_report: Optional[bool] = False
    provider: Optional[str] = None  # Add provider parameter

# Pydantic models for MongoDB
class User(BaseModel):
    userId: str
    lastActive: datetime
    preferences: Optional[dict] = None

class ActivityLog(BaseModel):
    userId: str
    userEmail: Optional[str] = None
    timestamp: datetime
    actionType: str  # 'QUICK_SEARCH', 'DEEP_RESEARCH', 'DOC_ANALYSIS'
    query: Optional[str] = None
    documentName: Optional[str] = None
    documentFormat: Optional[str] = None
    metadata: Optional[dict] = None

@app.get("/")
async def root():
    return {"message": "JARVIS Research System Backend is running"}

@app.get("/health")
async def health_check():
    import os
    
    # Check if required API keys are present
    google_key = bool(os.getenv("GOOGLE_API_KEY"))
    groq_key = bool(os.getenv("GROQ_API_KEY"))
    tavily_key = bool(os.getenv("TAVILY_API_KEY"))
    
    return {
        "status": "healthy" if all([google_key, groq_key, tavily_key]) else "degraded",
        "api_keys": {
            "google": google_key,
            "groq": groq_key,
            "tavily": tavily_key
        },
        "mongodb": mongo_client is not None
    }

async def perform_research(topic: str, is_deep: bool):
    """Perform research using the agent architecture"""
    try:
        logger.info(f"Starting research on topic: {topic}, deep: {is_deep}")
        
        # Initialize chief agent
        chief_agent = ChiefAgent()
        
        # Create initial state
        state = {
            "topic": topic,
            "is_deep": is_deep,
            "context": "",
            "sources": [],
            "images": [],
            "report": ""
        }
        
        # Execute the research workflow
        final_state = await chief_agent.execute(state)
        
        # Return result
        return ResearchResult(
            report=final_state["report"],
            sources=[Source(**source) for source in final_state["sources"]],
            images=final_state["images"]
        )
        
    except Exception as e:
        logger.error(f"Research error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Research failed: {str(e)}")

async def answer_question(question: str, context: str):
    """Answer a question using the AI Assistant agent"""
    try:
        logger.info(f"Answering question: {question}")
        
        # Initialize chief agent
        chief_agent = ChiefAgent()
        
        # Create state for Q&A
        state = {
            "question": question,
            "context": context,
            "answer": ""
        }
        
        # Execute the Q&A workflow
        final_state = await chief_agent.execute(state)
        
        # Return result
        return QuestionResult(answer=final_state["answer"])
        
    except Exception as e:
        logger.error(f"Q&A error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Q&A failed: {str(e)}")

async def analyze_document(file_base64: str, mime_type: str):
    """Analyze a document using the Document Analyzer agent"""
    try:
        logger.info(f"Analyzing document with MIME type: {mime_type}")
        
        # Initialize chief agent
        chief_agent = ChiefAgent()
        
        # Create state for document analysis
        state = {
            "file_base64": file_base64,
            "mime_type": mime_type,
            "report": "",
            "sources": [],
            "images": []
        }
        
        # Execute the document analysis workflow
        final_state = await chief_agent.execute(state)
        
        # Return result
        return ResearchResult(
            report=final_state["report"],
            sources=final_state["sources"],
            images=final_state["images"]
        )
        
    except Exception as e:
        logger.error(f"Document analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Document analysis failed: {str(e)}")

@app.post("/api/research")
async def start_research(request: ResearchRequest):
    """Endpoint to start research process"""
    try:
        logger.info(f"Received research request: {request.topic}")
        result = await perform_research(request.topic, request.is_deep)
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Research failed: {str(e)}")

@app.post("/api/question")
async def ask_question(request: QuestionRequest):
    """Endpoint to ask questions about research context"""
    try:
        logger.info(f"Received question: {request.question}")
        result = await answer_question(request.question, request.context)
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Q&A failed: {str(e)}")

@app.post("/api/document-analysis")
async def document_analysis(request: DocumentAnalysisRequest):
    """Endpoint to analyze documents"""
    try:
        logger.info(f"Received document analysis request with MIME type: {request.mime_type}")
        result = await analyze_document(request.file_base64, request.mime_type)
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Document analysis failed: {str(e)}")

@app.post("/api/llm/generate")
async def generate_llm_content_endpoint(request: LLMRequest):
    """Endpoint to generate content using LLM via backend with fallback providers"""
    try:
        logger.info(f"Received LLM generation request")
        
        # Import the updated LLM utility function
        from backend.llm_utils import generate_llm_content
        
        # Generate content using the updated function with proper fallback support
        result = generate_llm_content(
            prompt=request.prompt,
            system_instruction=request.system_instruction,
            is_report=bool(request.is_report),
            provider=request.provider  # Pass provider parameter
        )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"LLM generation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"LLM generation failed: {str(e)}")

@app.post("/api/logs")
async def log_activity(activity: ActivityLog):
    """Endpoint to log user activity to MongoDB"""
    if mongo_client is None or db is None or users_collection is None or activity_collection is None:
        logger.warning("MongoDB client not initialized")
        return {"message": "MongoDB not connected"}
    
    try:
        # Update user's last active time and email if provided
        user_data = {
            "userId": activity.userId,
            "lastActive": activity.timestamp
        }
        
        # Add email if provided in the activity log
        if activity.userEmail:
            user_data["email"] = activity.userEmail
        
        users_collection.update_one(
            {"userId": activity.userId},
            {"$set": user_data},
            upsert=True
        )
        
        # Insert activity log
        activity_dict = activity.dict()
        result = activity_collection.insert_one(activity_dict)
        
        logger.info(f"Logged activity for user {activity.userId} with action {activity.actionType}")
        return {"message": "Activity logged successfully", "id": str(result.inserted_id)}
    except Exception as e:
        logger.error(f"Failed to log activity: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to log activity: {str(e)}")

@app.get("/api/user-history/{user_id}")
async def get_user_history(user_id: str):
    """Endpoint to retrieve user activity history from MongoDB"""
    if mongo_client is None or activity_collection is None:
        logger.warning("MongoDB client not initialized")
        raise HTTPException(status_code=500, detail="MongoDB not connected")
    
    try:
        # Query activity logs for the user, sorted by timestamp descending
        cursor = activity_collection.find({"userId": user_id}).sort("timestamp", -1)
        logs = []
        for doc in cursor:
            # Convert ObjectId to string for JSON serialization
            doc["_id"] = str(doc["_id"])
            logs.append(doc)
        
        return {"logs": logs}
    except Exception as e:
        logger.error(f"Failed to retrieve user history: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve user history: {str(e)}")

@app.options("/api/research")
async def research_options():
    return {"message": "API endpoint for research requests"}

@app.get("/api/duckduckgo/search")
async def duckduckgo_search(query: str, max_results: int = 10):
    """Endpoint to search for text results using DuckDuckGo"""
    try:
        from backend.search.duckduckgo_search import perform_duckduckgo_search
        
        # Perform DuckDuckGo search
        result = perform_duckduckgo_search(query)
        
        # Limit results
        limited_results = result.get("results", [])[:max_results]
        result["results"] = limited_results
        
        return result
    except Exception as e:
        logger.error(f"DuckDuckGo search failed: {e}")
        raise HTTPException(status_code=500, detail=f"DuckDuckGo search failed: {str(e)}")

@app.get("/api/duckduckgo/images")
async def duckduckgo_image_search(query: str, max_results: int = 5):
    """Endpoint to search for images using DuckDuckGo"""
    try:
        from backend.search.duckduckgo_search import perform_duckduckgo_search
        
        # Perform DuckDuckGo search
        result = perform_duckduckgo_search(query)
        
        # Return only the images
        return {"images": result.get("images", [])[:max_results]}
    except Exception as e:
        logger.error(f"DuckDuckGo image search failed: {e}")
        raise HTTPException(status_code=500, detail=f"DuckDuckGo image search failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    import os
    # Render.com requires binding to PORT environment variable
    port = int(os.environ.get("PORT", 8002))
    uvicorn.run("backend.server:app", host="0.0.0.0", port=port, reload=False)
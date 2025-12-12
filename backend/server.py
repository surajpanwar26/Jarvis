import os
import logging
from datetime import datetime
from typing import List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import asyncio
import requests
from requests.exceptions import Timeout

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI()

# CORS middleware
# Get CORS origins from environment variable, with fallback to localhost for development
CORS_ORIGINS = os.getenv("CORS_ORIGINS", f"http://localhost:{os.getenv('FRONTEND_PORT', '5173')},http://localhost:{os.getenv('PORT', '8000')},http://localhost:{os.getenv('ALT_PORT', '3000')}").split(",")
CORS_ORIGINS = [origin.strip() for origin in CORS_ORIGINS if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
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
        
        # Import and initialize the LLM provider
        import os
        import requests
        from requests.exceptions import Timeout
        
        # Optimize token usage based on request type
        is_report_generation = "report" in request.prompt.lower() or (request.system_instruction and "report" in request.system_instruction.lower())
        
        # Try providers in order of preference (Google Gemini -> Groq -> Hugging Face)
        # Hugging Face deprioritized due to reliability issues
        providers = []
        
        # 1. Google Gemini (primary) - Re-enabled for better accuracy
        google_api_key = os.getenv("GOOGLE_API_KEY")
        if google_api_key:
            providers.append({
                "name": "Google Gemini",
                "url": f"https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key={google_api_key}",
                "payload": {
                    "contents": [{
                        "parts": [{
                            "text": request.prompt
                        }]
                    }],
                    "generationConfig": {
                        "temperature": 0.7,
                        "maxOutputTokens": 4096 if is_report_generation else 2048
                    }
                },
                "headers": {"Content-Type": "application/json"}
            })
            
            if request.system_instruction:
                providers[-1]["payload"]["systemInstruction"] = {"parts": [{"text": request.system_instruction}]}
        
        # 2. Groq (first fallback)
        groq_api_key = os.getenv("GROQ_API_KEY")
        if groq_api_key:
            providers.append({
                "name": "Groq",
                "url": "https://api.groq.com/openai/v1/chat/completions",
                "payload": {
                    "model": "llama-3.1-8b-instant",
                    "messages": [
                        {"role": "system", "content": request.system_instruction or "You are a helpful research assistant."},
                        {"role": "user", "content": request.prompt}
                    ],
                    "temperature": 0.5,
                    "max_tokens": 1024 if not is_report_generation else 2048  # Reduce tokens for non-report generation
                },
                "headers": {
                    "Authorization": f"Bearer {groq_api_key}",
                    "Content-Type": "application/json"
                }
            })
            
            if request.json_mode:
                providers[-1]["payload"]["response_format"] = {"type": "json_object"}
        
        # 3. Hugging Face (deprioritized fallback) - Use updated working model
        hugging_face_api_key = os.getenv("HUGGINGFACE_API_KEY")
        if hugging_face_api_key:
            providers.append({
                "name": "Hugging Face",
                "url": "https://api-inference.huggingface.co/models/Qwen/Qwen2.5-7B-Instruct",
                "payload": {
                    "inputs": f"<|user|>\n{request.system_instruction or 'You are a helpful assistant.'}\n\n{request.prompt}\n<|end|>\n<|assistant|>",
                    "parameters": {
                        "max_new_tokens": 500 if not is_report_generation else 1000,
                        "return_full_text": False,
                        "temperature": 0.7
                    }
                },
                "headers": {
                    "Authorization": f"Bearer {hugging_face_api_key}",
                    "Content-Type": "application/json"
                }
            })        
        if not providers:
            raise HTTPException(status_code=500, detail="No API keys configured for LLM providers")
        
        # Try each provider in order
        last_error = None
        attempted_providers = []
        
        for provider in providers:
            try:
                logger.info(f"Trying LLM provider: {provider['name']}")
                attempted_providers.append(provider['name'])
                
                # Add timeout to prevent hanging requests
                response = requests.post(
                    provider["url"],
                    json=provider["payload"],
                    headers=provider["headers"],
                    timeout=30  # 30 second timeout
                )
                
                # Handle different response status codes
                if response.status_code == 401:
                    logger.warning(f"{provider['name']} authentication failed (401)")
                    continue
                elif response.status_code == 403:
                    logger.warning(f"{provider['name']} access forbidden (403)")
                    continue
                elif response.status_code == 429:
                    logger.warning(f"{provider['name']} rate limit exceeded (429)")
                    continue
                elif response.status_code >= 500:
                    logger.warning(f"{provider['name']} server error ({response.status_code})")
                    continue
                
                response.raise_for_status()
                
                # Parse response based on provider
                if provider["name"] == "Google Gemini":
                    result = response.json()
                    content = result["candidates"][0]["content"]["parts"][0]["text"]
                elif "Hugging Face" in provider["name"]:
                    result = response.json()
                    content = result[0]["generated_text"] if isinstance(result, list) else result.get("generated_text", "")
                elif provider["name"] == "Groq":
                    result = response.json()
                    content = result["choices"][0]["message"]["content"]
                else:
                    content = response.text
                
                logger.info(f"Successfully generated content using {provider['name']}")
                return {"content": content, "provider": provider["name"], "attempted_providers": attempted_providers[:-1]}
                
            except Timeout:
                logger.warning(f"{provider['name']} request timed out")
                continue
            except requests.exceptions.ConnectionError as e:
                logger.warning(f"{provider['name']} connection error: {str(e)}")
                continue
            except requests.exceptions.HTTPError as e:
                last_error = e
                logger.warning(f"{provider['name']} HTTP error: {str(e)}")
                continue
            except Exception as e:
                last_error = e
                # Check if this is a quota limit error
                error_str = str(e).lower()
                is_quota_error = "429" in error_str or "quota" in error_str or "limit" in error_str or "exceeded" in error_str
                
                if is_quota_error:
                    logger.warning(f"{provider['name']} quota limit hit: {str(e)}")
                else:
                    logger.warning(f"Failed to generate content with {provider['name']}: {str(e)}")
                
                # Continue to the next provider regardless of error type
                continue
        
        # If we get here, all providers failed - return a simple fallback response
        logger.warning(f"All LLM providers failed. Last error: {str(last_error)}. Returning fallback response.")
        attempted_providers_str = ", ".join(attempted_providers) if attempted_providers else "None"
        fallback_content = f"""I apologize, but I'm unable to generate a detailed response at the moment due to API limitations. Here's a brief overview based on general knowledge:

**Topic**: {request.prompt.split(':')[0] if ':' in request.prompt else request.prompt[:50] + '...' if len(request.prompt) > 50 else request.prompt}

This is a fallback response because all configured AI providers are currently unavailable or experiencing issues:
- Attempted providers: {attempted_providers_str}
- Last error: {str(last_error)[:100] if last_error else 'Unknown'}

Please check your API keys and network connectivity, or try again later."""

        return {"content": fallback_content, "provider": "Fallback", "attempted_providers": attempted_providers}
        
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
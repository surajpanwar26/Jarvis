# JARVIS AI Researcher - Complete Technical Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Technology Stack](#technology-stack)
4. [Core Components](#core-components)
5. [Authentication System](#authentication-system)
6. [LLM Integration & Fallback Mechanism](#llm-integration--fallback-mechanism)
7. [API Endpoints](#api-endpoints)
8. [Agent System](#agent-system)
9. [Data Flow & Processing](#data-flow--processing)
10. [Database Management](#database-management)
11. [Frontend Implementation](#frontend-implementation)
12. [Deployment & Environment Configuration](#deployment--environment-configuration)
13. [Testing Strategy](#testing-strategy)
14. [Performance Optimization](#performance-optimization)
15. [Security Considerations](#security-considerations)
16. [Troubleshooting Guide](#troubleshooting-guide)
17. [Interview Preparation](#interview-preparation)

## 1. Project Overview

JARVIS AI Researcher is a sophisticated multi-agent AI research platform that leverages Google's Gemini AI to conduct comprehensive research, generate detailed reports, and analyze documents. The system mimics the `gpt-researcher` agentic workflow but with enhanced capabilities and a more robust architecture.

### Key Features:
- **Multi-Agent Architecture**: Specialized agents for research, reporting, document analysis, and more
- **Multiple Research Modes**: Quick Research, Deep Research, and Document Analysis
- **Real-time Visualization**: Watch the AI thought process unfold in real-time
- **Rich Media Integration**: Automatic image fetching and embedding in reports
- **Export Capabilities**: Export research findings to PDF and DOCX formats
- **Secure Authentication**: Google OAuth 2.0 integration for user authentication
- **Seamless Fallback**: Robust fallback mechanisms for API failures

## 2. System Architecture

The JARVIS system follows a microservices-like architecture with a clear separation between frontend and backend components:

```
┌─────────────────────────────────────────────────────────────────────┐
│                           FRONTEND                                  │
│  ┌───────────────┐    ┌───────────────┐    ┌─────────────────────┐ │
│  │   React App   │◄──►│ Agent System  │◄──►│  Service Layer      │ │
│  │               │    │               │    │                     │ │
│  │ Pages & UI    │    │ Research      │    │ API Clients &       │ │
│  │ Components    │    │ Workflow      │    │ Config Services     │ │
│  └───────────────┘    └───────────────┘    └─────────────────────┘ │
└─────────────────────────────▲───────────────────────────────────────┘
                              │ HTTP/REST API
┌─────────────────────────────▼───────────────────────────────────────┐
│                           BACKEND                                   │
│  ┌───────────────┐    ┌───────────────┐    ┌─────────────────────┐ │
│  │  FastAPI      │◄──►│ Agent System  │◄──►│  LLM & Search       │ │
│  │               │    │               │    │  Services           │ │
│  │ API Routes    │    │ Chief Agent   │    │                     │ │
│  │ Middleware    │    │ Specialized   │    │ Google Gemini       │ │
│  │ Auth Handler  │    │ Agents        │    │ Groq API            │ │
│  └───────────────┘    └───────────────┘    │ Tavily API          │ │
│                              │             │ Hugging Face API    │ │
│                              ▼             │ DuckDuckGo Search   │ │
│                        ┌───────────────┐   │ Local Processing    │ │
│                        │   MongoDB     │◄──┤                     │ │
│                        │               │   └─────────────────────┘ │
│                        │ Data Storage  │                         │
│                        │ & Logging     │                         │
│                        └───────────────┘                         │
└─────────────────────────────────────────────────────────────────────┘
```

### Architecture Patterns:
1. **Multi-Agent System**: Inspired by LangGraph principles, where each agent has a specialized role
2. **Service-Oriented Approach**: Clear separation between business logic, data access, and presentation layers
3. **Event-Driven Communication**: Agents communicate through events and state updates
4. **Fallback Mechanisms**: Redundant systems ensure high availability

## 3. Technology Stack

### Frontend:
- **React 18**: Modern UI framework with hooks and functional components
- **TypeScript**: Strongly typed JavaScript for better code quality
- **Vite**: Ultra-fast build tool and development server
- **TailwindCSS**: Utility-first CSS framework for responsive design
- **Axios**: HTTP client for API communications

### Backend:
- **Python 3.9+**: Core programming language
- **FastAPI**: High-performance web framework with automatic OpenAPI documentation
- **Uvicorn**: ASGI server for asynchronous request handling
- **Pydantic**: Data validation and settings management
- **Requests**: HTTP library for external API calls

### AI & Machine Learning:
- **Google Gemini 2.5 Flash**: Primary LLM for research and analysis
- **Groq API**: Secondary LLM for faster processing
- **Hugging Face Inference API**: Tertiary LLM for additional redundancy
- **Tavily API**: Web search and information gathering
- **DuckDuckGo Search**: Alternative search mechanism

### Database & Storage:
- **MongoDB**: NoSQL database for user data and activity logs
- **GridFS**: For storing large files and documents

### Authentication:
- **Google OAuth 2.0**: Secure user authentication
- **JWT**: Token-based session management
- **SessionMiddleware**: Server-side session handling

### Deployment & Infrastructure:
- **Render.com**: Cloud hosting platform
- **Docker**: Containerization (optional)
- **Nginx**: Reverse proxy (optional)

## 4. Core Components

### 4.1 Frontend Components

#### Pages:
1. **HomePage.tsx**: Main landing page with research mode selection
2. **LoginPage.tsx**: Google OAuth authentication interface
3. **QuickResultPage.tsx**: Interface for quick research results
4. **DeepResearchPage.tsx**: Interface for deep research results
5. **DocAnalysisPage.tsx**: Interface for document analysis

#### Components:
1. **ResearchLogs.tsx**: Real-time agent activity visualization
2. **MarkdownRenderer.tsx**: Rich text rendering for reports
3. **ChatPanel.tsx**: Interactive AI chatbot interface
4. **WaveLoader.tsx**: Animated loading indicators
5. **FileUploader.tsx**: Document upload component
6. **Icons.tsx**: SVG icon library
7. **Logo.tsx**: JARVIS branding elements

#### Services:
1. **agentSystem.ts**: Frontend orchestration of research workflow
2. **llmProvider.ts**: LLM abstraction layer
3. **searchProvider.ts**: Search service abstraction
4. **analysisService.ts**: Document analysis and Q&A services
5. **apiClient.ts**: Backend API communication
6. **config.ts**: Configuration management
7. **mongoService.ts**: Activity logging and user data
8. **exportService.ts**: Report export functionality

### 4.2 Backend Components

#### Core Modules:
1. **server.py**: Main FastAPI application with routing
2. **auth.py**: Authentication and session management
3. **llm_utils.py**: LLM interaction and fallback logic
4. **rag.py**: Retrieval-Augmented Generation utilities
5. **utils.py**: Shared utility functions

#### Agent System:
1. **chief_agent.py**: Master orchestrator of all agents
2. **base_agent.py**: Abstract base class for all agents
3. **researcher_agent.py**: Web research and information gathering
4. **image_agent.py**: Visual asset extraction and processing
5. **source_agent.py**: Source validation and enrichment
6. **report_agent.py**: Report generation and formatting
7. **ai_assistant_agent.py**: Interactive Q&A system
8. **document_analyzer_agent.py**: Cloud-based document analysis
9. **local_document_analyzer.py**: Offline document processing

#### Search Modules:
1. **duckduckgo_search.py**: Alternative search implementation
2. **tavily_search.py**: Primary search service integration

## 5. Authentication System

### 5.1 Google OAuth 2.0 Implementation

The authentication system uses Google OAuth 2.0 for secure user login. The implementation follows OAuth 2.0 Authorization Code Flow with PKCE for enhanced security.

#### Key Components:
1. **OAuth Client Registration**: 
   - Google Cloud Console project with OAuth 2.0 credentials
   - Authorized redirect URIs for both development and production
   - Client ID and Client Secret stored securely in environment variables

2. **Authentication Flow**:
   ```
   1. User clicks "Continue with Google"
   2. Frontend redirects to Google OAuth endpoint
   3. User authenticates with Google
   4. Google redirects back to callback URL with authorization code
   5. Backend exchanges code for access token
   6. User profile information retrieved
   7. Session created and JWT token issued
   8. User redirected to application
   ```

3. **Session Management**:
   - Server-side sessions using SessionMiddleware
   - Session secret key stored in environment variables
   - Automatic session expiration and cleanup
   - Secure cookie handling with SameSite and HttpOnly flags

4. **JWT Token System**:
   - Stateless authentication tokens
   - Token expiration (typically 24 hours)
   - Refresh token mechanism for extended sessions
   - Token validation on protected endpoints

#### Implementation Details (auth.py):
```python
# OAuth client initialization
oauth = OAuth()
oauth.register(
    name='google',
    client_id=os.getenv("GOOGLE_CLIENT_ID"),
    client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={'scope': 'openid email profile'}
)

# Login endpoint
@router.get("/login")
async def login_via_google(request: Request):
    """Initiate Google OAuth login"""
    # Determine redirect URI based on environment
    is_production = "jarvis-backend-nzcg.onrender.com" in request.headers.get("host", "")
    
    if is_production:
        redirect_uri = "https://jarvis-backend-nzcg.onrender.com/api/auth/google/callback"
    else:
        redirect_uri = f"http://localhost:{os.getenv('PORT', '8002')}/api/auth/google/callback"
    
    # Force account selection
    return await oauth.google.authorize_redirect(request, redirect_uri, prompt='select_account')

# Callback endpoint
@router.get("/google/callback")
async def google_callback(request: Request):
    """Handle Google OAuth callback"""
    try:
        # Exchange authorization code for access token
        token = await oauth.google.authorize_access_token(request)
        user_info = token.get('userinfo')
        
        if not user_info:
            raise HTTPException(status_code=400, detail="Failed to retrieve user info")
        
        # Store user information in session
        request.session['user'] = dict(user_info)
        
        # Redirect to frontend with success flag
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
        return RedirectResponse(f"{frontend_url}?auth=success")
        
    except Exception as e:
        logger.error(f"OAuth callback failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Authentication failed: {str(e)}")

# Logout endpoint
@router.get("/logout")
async def logout(request: Request):
    """Logout user and clear session"""
    request.session.pop('user', None)
    return {"message": "Logged out successfully"}

# Authentication middleware
async def get_current_user(request: Request):
    """Dependency to get current authenticated user"""
    user = request.session.get('user')
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user
```

### 5.2 Security Considerations

1. **Environment Variables**: 
   - Sensitive credentials stored in environment variables
   - Never committed to version control
   - Production values configured in Render dashboard

2. **CORS Configuration**:
   - Strict origin whitelisting
   - Different policies for development vs production
   - Credential handling with proper flags

3. **Session Security**:
   - Secure session secret key
   - HttpOnly and SameSite cookie attributes
   - Session expiration and cleanup

4. **Token Management**:
   - JWT signing with strong secret keys
   - Token expiration and refresh mechanisms
   - Secure token transmission

## 6. LLM Integration & Fallback Mechanism

### 6.1 Multi-Provider Architecture

JARVIS implements a sophisticated multi-provider LLM system with automatic fallback capabilities. This ensures high availability and resilience against individual provider failures.

#### Provider Hierarchy:
1. **Google Gemini (Primary)**: 
   - Model: gemini-2.5-flash
   - Strengths: Large context window (1M tokens), native internet access
   - Use Cases: Report generation, document analysis, complex reasoning

2. **Groq (Secondary)**:
   - Model: llama-3.1-8b-instant
   - Strengths: Extremely fast inference, good balance of speed and quality
   - Use Cases: Quick responses, intermediate processing steps

3. **Hugging Face (Tertiary)**:
   - Models: mistralai/Mistral-7B-Instruct-v0.2, HuggingFaceH4/zephyr-7b-beta
   - Strengths: Community-driven models, diverse options
   - Use Cases: Backup when primary providers fail

### 6.2 Fallback Implementation

The fallback mechanism is implemented at multiple levels to ensure seamless operation:

#### Frontend Level:
```typescript
// services/llmProvider.ts
export const getLLMProvider = (): LLMProvider => {
  // 1. Google Gemini (Primary for everything)
  if (hasKey(config.googleApiKey)) {
    console.log("Using Provider: Google Gemini");
    return new GeminiProvider(config.googleApiKey!);
  }
  
  // 2. Groq (Secondary)
  if (hasKey(config.groqApiKey)) {
    console.log("Using Provider: Groq");
    return new GroqProvider(config.groqApiKey!);
  }

  // 3. Hugging Face (Fallback)
  if (hasKey(config.huggingFaceApiKey)) {
    console.log("Using Provider: HuggingFace");
    return new HuggingFaceProvider(config.huggingFaceApiKey!);
  }
  
  throw new Error("Missing API Key. Please add GOOGLE_API_KEY to your .env file.");
};
```

#### Backend Level:
```python
# backend/llm_utils.py
def generate_llm_content(prompt: str, system_instruction: str = "", is_report: bool = False, provider: Optional[str] = None) -> Dict[str, Any]:
    """Generate content using LLM with fallback providers"""
    logger.info("Generating LLM content with fallback support")
    
    # Try providers in order of preference
    providers = []
    
    # 1. Google Gemini (primary)
    google_api_key = os.getenv("GOOGLE_API_KEY")
    if google_api_key and (provider is None or provider == "gemini"):
        providers.append({
            "name": "Google Gemini",
            "url": f"{os.getenv('GEMINI_API_URL', 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent')}?key={google_api_key}",
            "payload": {
                "contents": [{
                    "parts": [{
                        "text": prompt
                    }]
                }],
                "generationConfig": {
                    "temperature": 0.7,
                    "maxOutputTokens": 4096 if is_report else 2048
                }
            },
            "headers": {"Content-Type": "application/json"}
        })
        
        if system_instruction:
            providers[-1]["payload"]["systemInstruction"] = {"parts": [{"text": system_instruction}]}
    
    # 2. Groq (first fallback)
    groq_api_key = os.getenv("GROQ_API_KEY")
    if groq_api_key and (provider is None or provider == "groq"):
        providers.append({
            "name": "Groq",
            "url": os.getenv("GROQ_API_URL", "https://api.groq.com/openai/v1/chat/completions"),
            "payload": {
                "model": os.getenv("GROQ_MODEL", "llama-3.1-8b-instant"),
                "messages": [
                    {"role": "system", "content": system_instruction or "You are a helpful research assistant."},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.5,
                "max_tokens": 1024 if not is_report else 2048
            },
            "headers": {
                "Authorization": f"Bearer {groq_api_key}",
                "Content-Type": "application/json"
            }
        })
    
    # 3. Hugging Face (deprioritized fallback)
    hugging_face_api_key = os.getenv("HUGGINGFACE_API_KEY")
    if hugging_face_api_key and (provider is None or provider == "huggingface"):
        huggingface_models = os.getenv("HUGGINGFACE_MODELS", "mistralai/Mistral-7B-Instruct-v0.2,HuggingFaceH4/zephyr-7b-beta,google/gemma-2b-it").split(",")
        
        # Try each model in order until one works
        for model_id in huggingface_models:
            providers.append({
                "name": f"Hugging Face ({model_id})",
                "type": "huggingface_client",
                "model": model_id,
                "api_key": hugging_face_api_key,
                "payload": {
                    "prompt": prompt,
                    "system_instruction": system_instruction,
                    "max_tokens": 500 if not is_report else 1000,
                    "temperature": 0.7
                }
            })

    if not providers:
        raise Exception("No API keys configured for LLM providers")
    
    # Try each provider in order
    last_error = None
    attempted_providers = []
    
    for provider_item in providers:
        try:
            logger.info(f"Trying LLM provider: {provider_item['name']}")
            attempted_providers.append(provider_item['name'])
            
            # Handle different provider types
            if provider_item.get("type") == "huggingface_client":
                # Use Hugging Face InferenceClient
                from huggingface_hub import InferenceClient
                
                client = InferenceClient(token=provider_item["api_key"])
                payload = provider_item["payload"]
                
                # Prepare messages for chat completion
                messages = []
                if payload.get("system_instruction"):
                    messages.append({"role": "system", "content": payload["system_instruction"]})
                messages.append({"role": "user", "content": payload["prompt"]})
                
                response = client.chat_completion(
                    messages=messages,
                    model=provider_item["model"],
                    max_tokens=payload.get("max_tokens", 500),
                    temperature=payload.get("temperature", 0.7)
                )
                
                content = response.choices[0].message.content
            else:
                # Existing logic for other providers
                # Add timeout to prevent hanging requests
                response = requests.post(
                    provider_item["url"],
                    json=provider_item["payload"],
                    headers=provider_item["headers"],
                    timeout=30  # 30 second timeout
                )
                
                # Handle different response status codes
                if response.status_code == 401:
                    logger.warning(f"{provider_item['name']} authentication failed (401)")
                    continue
                elif response.status_code == 403:
                    logger.warning(f"{provider_item['name']} access forbidden (403)")
                    continue
                elif response.status_code == 429:
                    logger.warning(f"{provider_item['name']} rate limit exceeded (429)")
                    continue
                elif response.status_code >= 500:
                    logger.warning(f"{provider_item['name']} server error ({response.status_code})")
                    continue
                
                response.raise_for_status()
                
                # Parse response based on provider
                if provider_item["name"].startswith("Google Gemini"):
                    result = response.json()
                    content = result["candidates"][0]["content"]["parts"][0]["text"]
                elif provider_item["name"].startswith("Hugging Face"):
                    result = response.json()
                    content = result[0]["generated_text"] if isinstance(result, list) else result.get("generated_text", "")
                elif provider_item["name"] == "Groq":
                    result = response.json()
                    content = result["choices"][0]["message"]["content"]
                else:
                    content = response.text
            
            logger.info(f"Successfully generated content using {provider_item['name']}")
            return {"content": content, "provider": provider_item["name"], "attempted_providers": attempted_providers[:-1]}
            
        except Timeout:
            logger.warning(f"{provider_item['name']} request timed out")
            continue
        except requests.exceptions.ConnectionError as e:
            logger.warning(f"{provider_item['name']} connection error: {str(e)}")
            continue
        except requests.exceptions.HTTPError as e:
            last_error = e
            logger.warning(f"{provider_item['name']} HTTP error: {str(e)}")
            continue
        except Exception as e:
            last_error = e
            logger.warning(f"{provider_item['name']} unexpected error: {str(e)}")
            continue
    
    # If we get here, all providers failed - return a simple fallback response
    logger.warning(f"All LLM providers failed. Last error: {str(last_error)}. Returning fallback response.")
    attempted_providers_str = ", ".join(attempted_providers) if attempted_providers else "None"
    fallback_content = f"""I apologize, but I'm unable to generate a detailed response at the moment due to API limitations. Here's a brief overview based on general knowledge:

**Topic**: {prompt.split(':')[0] if ':' in prompt else prompt[:50] + '...' if len(prompt) > 50 else prompt}

This is a fallback response because all configured AI providers are currently unavailable or experiencing issues:
- Attempted providers: {attempted_providers_str}
- Last error: {str(last_error)[:100] if last_error else 'Unknown'}

Please check your API keys and network connectivity, or try again later."""

    return {"content": fallback_content, "provider": "Fallback", "attempted_providers": attempted_providers}
```

### 6.3 Error Handling and Recovery

The system implements comprehensive error handling for various failure scenarios:

1. **Authentication Failures (401, 403)**:
   - Automatically tries next provider
   - Logs authentication issues
   - Continues processing without user interruption

2. **Rate Limiting (429)**:
   - Detects quota exceeded errors
   - Attempts reduced token requests
   - Moves to next provider seamlessly

3. **Network Issues**:
   - Handles connection timeouts
   - Manages network unreachable errors
   - Retries with alternative providers

4. **Server Errors (5xx)**:
   - Detects backend service issues
   - Automatically switches providers
   - Maintains user experience continuity

5. **Complete Provider Failure**:
   - Generates informative fallback response
   - Provides context about what went wrong
   - Offers guidance for resolution

## 7. API Endpoints

### 7.1 REST API Endpoints

The backend exposes a comprehensive REST API for frontend communication:

#### Authentication Endpoints:
```
GET  /api/auth/login              # Initiate Google OAuth login
GET  /api/auth/google/callback    # Handle OAuth callback
GET  /api/auth/logout             # Logout user
```

#### Research Endpoints:
```
POST /api/research                # Start research process
POST /api/question                # Ask questions about research context
POST /api/document-analysis       # Analyze uploaded documents
```

#### LLM Endpoints:
```
POST /api/llm/generate            # Generate content using LLM with fallback
```

#### Utility Endpoints:
```
GET  /api/health                  # Health check endpoint
GET  /                            # Root endpoint
```

#### Logging Endpoints:
```
POST /api/logs                    # Log user activity
GET  /api/user-history/{user_id}  # Retrieve user activity history
```

#### Search Endpoints:
```
GET  /api/duckduckgo/search       # Search for text results using DuckDuckGo
GET  /api/duckduckgo/images       # Search for images using DuckDuckGo
```

### 7.2 WebSocket Implementation

While the current implementation primarily uses REST APIs, WebSocket support can be added for real-time updates:

#### Potential WebSocket Endpoints:
```
WS   /ws/research/{session_id}    # Real-time research updates
WS   /ws/chat/{session_id}        # Real-time chat interactions
WS   /ws/documents/{session_id}   # Document analysis progress
```

#### WebSocket Implementation (Conceptual):
```python
# server.py (additional imports)
from fastapi import WebSocket
from fastapi.websockets import WebSocketDisconnect

# WebSocket manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

manager = ConnectionManager()

# WebSocket endpoint
@app.websocket("/ws/research/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Process incoming data
            await manager.send_personal_message(f"You wrote: {data}", websocket)
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        await manager.broadcast(f"Client {session_id} left the chat")
```

### 7.3 API Request/Response Examples

#### Start Research:
```bash
# Request
POST /api/research
Content-Type: application/json

{
  "topic": "Climate change impact on agriculture",
  "is_deep": true
}

# Response
{
  "report": "# Climate Change Impact on Agriculture\n\n## Executive Summary\n...",
  "sources": [
    {
      "title": "Climate Change and Agriculture - USDA",
      "uri": "https://www.usda.gov/climate-change-agriculture"
    }
  ],
  "images": [
    "https://example.com/climate-agriculture-chart.png"
  ]
}
```

#### Document Analysis:
```bash
# Request
POST /api/document-analysis
Content-Type: application/json

{
  "file_base64": "base64_encoded_file_content",
  "mime_type": "application/pdf"
}

# Response
{
  "report": "# Document Analysis\n\n## Executive Summary\n...",
  "sources": [
    {
      "title": "Uploaded Document",
      "uri": "#local-file"
    }
  ],
  "images": []
}
```

#### LLM Generation:
```bash
# Request
POST /api/llm/generate
Content-Type: application/json

{
  "prompt": "Explain quantum computing in simple terms",
  "system_instruction": "You are a science educator explaining complex topics to beginners",
  "json_mode": false,
  "is_report": false
}

# Response
{
  "content": "Quantum computing is like having a magical calculator that can solve certain problems much faster than regular computers...",
  "provider": "Google Gemini",
  "attempted_providers": []
}
```

## 8. Agent System

### 8.1 Agent Architecture

JARVIS implements a sophisticated multi-agent system inspired by LangGraph principles. Each agent has a specialized role and communicates through a shared state mechanism.

#### Agent Hierarchy:
```
Chief Agent (Orchestrator)
├── Researcher Agent (Web Research)
├── Image Agent (Visual Asset Extraction)
├── Source Agent (Source Validation)
├── Report Agent (Report Generation)
├── AI Assistant Agent (Interactive Q&A)
├── Document Analyzer Agent (Cloud-based Document Analysis)
└── Local Document Analyzer Agent (Offline Document Processing)
```

### 8.2 Agent Implementation Details

#### Chief Agent:
```python
# backend/agents/chief_agent.py
class ChiefAgent(BaseAgent):
    """Chief agent that orchestrates all other agents"""
    
    def __init__(self):
        super().__init__("Chief")
        self.researcher = ResearcherAgent()
        self.image_agent = ImageAgent()
        self.source_agent = SourceAgent()
        self.report_agent = ReportAgent()
        self.ai_assistant = AIAssistantAgent()
        self.document_analyzer = DocumentAnalyzerAgent()
        self.local_document_analyzer = LocalDocumentAnalyzerAgent()
    
    async def execute(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """Orchestrate the research workflow"""
        logger.info(f"[{self.name}] Starting research workflow")
        
        try:
            # Check if this is an AI Chatbot request
            if state.get("question"):
                # For AI Chatbot, we only need the AI Assistant agent
                logger.info(f"[{self.name}] Processing AI Chatbot request")
                state = await self.ai_assistant.execute(state)
            # Check if this is a document analysis request
            elif state.get("file_base64"):
                # For document analysis, try API-based first, then Groq, then local
                logger.info(f"[{self.name}] Processing document analysis request")
                try:
                    # First try: Google Gemini
                    state = await self.document_analyzer.execute(state)
                except Exception as gemini_error:
                    logger.warning(f"[{self.name}] Google Gemini document analysis failed: {str(gemini_error)}")
                    try:
                        # Second try: Groq
                        logger.info(f"[{self.name}] Falling back to Groq for document analysis")
                        from ..llm_utils import generate_llm_content
                        
                        file_base64 = state.get("file_base64", "")
                        mime_type = state.get("mime_type", "text/plain")
                        
                        prompt = f"""Analyze this document (MIME type: {mime_type}) and provide a comprehensive, meaningful summary of its contents. 
Focus on the key points, main ideas, and important details. Structure your response with clear sections: Executive Summary, Key Topics Covered, Main Arguments or Points, Significant Details, and Conclusion. Avoid technical jargon and provide an accessible explanation of what the document contains."""

                        result = generate_llm_content(
                            prompt=prompt,
                            system_instruction="You are a document analysis expert skilled at extracting key insights from various document formats. Focus on providing actionable insights rather than just summarizing content.",
                            is_report=True
                        )
                        
                        state["report"] = result.get("content", "Document analysis completed with Groq.")
                        state["sources"] = [{"title": "Uploaded Document", "uri": "#local-file"}]
                        state["images"] = []
                        
                    except Exception as groq_error:
                        logger.warning(f"[{self.name}] Groq document analysis failed, falling back to local analysis: {str(groq_error)}")
                        # Third try: Local document analyzer
                        state = await self.local_document_analyzer.execute(state)
            else:
                # For research requests, execute the full workflow
                logger.info(f"[{self.name}] Processing research request")
                
                # 1. Researcher Agent - Gather information
                state = await self.researcher.execute(state)
                
                # 2. Image Agent - Extract visual assets
                state = await self.image_agent.execute(state)
                
                # 3. Source Agent - Process sources
                state = await self.source_agent.execute(state)
                
                # 4. Report Agent - Generate report
                state = await self.report_agent.execute(state)
            
            logger.info(f"[{self.name}] Workflow completed successfully")
            return state
            
        except Exception as e:
            logger.error(f"[{self.name}] Workflow failed: {str(e)}")
            raise e
```

#### Researcher Agent:
```python
# backend/agents/researcher_agent.py
class ResearcherAgent(BaseAgent):
    """Agent responsible for web research using Tavily API"""
    
    def __init__(self):
        super().__init__("Researcher")
        self.tavily_api_key = os.getenv("TAVILY_API_KEY")
    
    async def execute(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """Perform web research on the given topic"""
        topic = state.get("topic", "")
        is_deep = state.get("is_deep", False)
        
        logger.info(f"[{self.name}] Starting research on topic: {topic}")
        
        # Perform search with fallback chain
        search_query = f"comprehensive information about {topic}" if is_deep else f"overview of {topic}"
        search_results = None
        
        # Fallback chain: Tavily → DuckDuckGo → Google → Groq → Hugging Face
        providers = [
            {"name": "Tavily", "func": self._perform_tavily_search},
            {"name": "DuckDuckGo", "func": self._perform_duckduckgo_search},
            {"name": "Google", "func": self._perform_google_search},
            {"name": "Groq", "func": self._perform_groq_search},
            {"name": "Hugging Face", "func": self._perform_huggingface_search}
        ]
        
        for provider in providers:
            try:
                logger.info(f"[{self.name}] Trying search provider: {provider['name']}")
                search_results = await provider["func"](search_query)
                if search_results and search_results.get("text"):
                    logger.info(f"[{self.name}] Successfully retrieved results from {provider['name']}")
                    break
            except Exception as e:
                logger.warning(f"[{self.name}] {provider['name']} search failed: {str(e)}")
                continue
        
        if not search_results:
            raise Exception("All search providers failed to return results")
        
        # Update state with research findings
        state["context"] = state.get("context", []) + [search_results.get("text", "")]
        state["sources"] = state.get("sources", []) + search_results.get("sources", [])
        
        logger.info(f"[{self.name}] Research completed with {len(search_results.get('sources', []))} sources")
        return state
    
    def _perform_tavily_search(self, query: str) -> Dict[str, Any]:
        """Perform search using Tavily API"""
        if not self.tavily_api_key:
            raise Exception("TAVILY_API_KEY not configured")
        
        url = "https://api.tavily.com/search"
        payload = {
            "api_key": self.tavily_api_key,
            "query": query,
            "search_depth": "advanced",
            "include_answer": True,
            "include_images": True,
            "max_results": 10
        }
        
        response = requests.post(url, json=payload)
        response.raise_for_status()
        
        result = response.json()
        return {
            "text": result.get("answer", "") + "\n\n" + "\n\n".join([r.get("content", "") for r in result.get("results", [])]),
            "sources": [{"title": r.get("title", ""), "uri": r.get("url", "")} for r in result.get("results", [])],
            "images": result.get("images", [])
        }
```

#### Report Agent:
```python
# backend/agents/report_agent.py
class ReportAgent(BaseAgent):
    """Agent responsible for generating reports using LLM with fallback support"""
    
    def __init__(self):
        super().__init__("Report")
    
    async def execute(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """Generate report using LLM with fallback support"""
        topic = state.get("topic", "")
        is_deep = state.get("is_deep", False)
        context = state.get("context", "")
        
        logger.info(f"[{self.name}] Generating {'deep' if is_deep else 'quick'} report on: {topic}")
        
        # Generate report using backend LLM endpoint (which has fallback chain)
        report_result = self._generate_report_with_llm(topic, context, is_deep)
        
        # Check if this is a fallback response
        provider_used = report_result.get("provider", "Unknown")
        if provider_used == "Fallback":
            logger.warning(f"[{self.name}] Report generated using fallback mechanism")
            self.emit_event("agent_action", f"Using fallback response due to API limitations. Report may be less detailed than usual.")
        else:
            logger.info(f"[{self.name}] Report successfully generated using {provider_used}")
            self.emit_event("agent_action", f"Report drafted using {provider_used}")
        
        logger.info(f"[{self.name}] Report generation completed")
        
        # Update state
        state["report"] = report_result.get("content", "")
        
        return state
    
    def _generate_report_with_llm(self, topic: str, context: str, is_deep: bool) -> Dict[str, Any]:
        """Generate report using backend LLM endpoint with fallback support"""
        if is_deep:
            prompt = f"""You are a professional research analyst and report writer tasked with creating a comprehensive, well-structured report on "{topic}".
            
Use the following context information to create a detailed report with the following structure:

# Executive Summary
Provide a comprehensive executive summary with 5-6 detailed paragraphs that thoroughly capture the essence of the topic, key insights, main conclusions, and critical dimensions. Each paragraph should focus on a different aspect or perspective of the topic to ensure comprehensive coverage.

# Introduction
Provide background information and context about the topic, explaining its significance and relevance.

# Detailed Analysis
Create 4-5 main sections with detailed analysis. Each section should have:
- Clear heading
- Well-structured content with supporting evidence
- Critical insights and observations
- Data-backed arguments where applicable

# Key Findings
Present key findings as bullet points with brief explanations.

# Implications
Discuss the significance and potential implications of the findings.

# Conclusions and Recommendations
Summarize key conclusions and provide actionable recommendations.

Context Information:
{context}

Ensure the report is well-organized and professionally formatted using proper Markdown syntax with appropriate headings and lists. Create a comprehensive report that provides substantial insights while remaining focused."""
        else:
            prompt = f"""You are a research analyst creating a concise but comprehensive overview report on "{topic}".

Use the following context information to structure your response:

# Executive Summary
Provide a comprehensive executive summary with 3-5 detailed paragraphs covering different aspects of the topic.

# Analysis and Insights
Provide critical analysis with supporting evidence from the context.

# Key Findings
Present key findings as bullet points.

# Implications
Discuss the significance and potential implications.

# Conclusions and Recommendations
Summarize key conclusions and provide actionable recommendations.

Context Information:
{context}

Create a well-structured report with proper headings, subheadings, and lists. Focus only on information that will be displayed in the UI."""

        try:
            result = generate_llm_content(
                prompt=prompt,
                system_instruction="You are a research analyst skilled at creating well-structured, concise reports optimized for display in a UI. Focus only on information that will be shown to the user. If you encounter any issues with API providers, gracefully handle fallback scenarios.",
                is_report=True
            )
            return result
        except Timeout:
            logger.error(f"[{self.name}] LLM generation timed out")
            raise Exception("Report generation timed out. Please try again later.")
        except Exception as e:
            logger.error(f"[{self.name}] LLM generation failed: {str(e)}")
            raise Exception(f"Report generation failed: {str(e)}")

    def emit_event(self, event_type: str, message: str):
        """Helper method to emit events"""
        # This would typically send events to the frontend
        logger.info(f"[{self.name}] {event_type}: {message}")
```

## 9. Data Flow & Processing

### 9.1 Research Data Flow

The research process follows a well-defined pipeline that transforms user input into a comprehensive report:

```
User Input (Topic) 
    ↓
Chief Agent (Orchestrator)
    ↓
Editor Agent (Planning)
    ↓
Researcher Agent (Web Search)
    ↓
Image Agent (Visual Assets)
    ↓
Source Agent (Validation)
    ↓
Writer Agent (Report Generation)
    ↓
Publisher Agent (Formatting)
    ↓
Final Report (Markdown)
```

#### Detailed Processing Steps:

1. **User Input Collection**:
   - Topic selection via UI
   - Research mode determination (Quick/Deep)
   - Initial state creation

2. **Planning Phase**:
   - Editor Agent generates targeted search queries
   - JSON array of specific research questions
   - Optimized for comprehensive coverage

3. **Research Phase**:
   - Web searches using multiple providers
   - Context gathering from authoritative sources
   - Source validation and deduplication

4. **Media Processing**:
   - Image extraction from search results
   - Visual asset categorization
   - Format standardization

5. **Source Validation**:
   - Duplicate removal
   - Authority verification
   - Metadata enrichment

6. **Report Generation**:
   - Structured content creation
   - Markdown formatting
   - Quality assurance

7. **Publication**:
   - Final formatting
   - UI-ready content preparation
   - Delivery to frontend

### 9.2 Document Analysis Data Flow

Document analysis follows a specialized pipeline:

```
Document Upload
    ↓
File Processing
    ↓
Content Extraction
    ↓
Text Analysis
    ↓
Insight Generation
    ↓
Report Formatting
    ↓
Result Delivery
```

#### Processing Stages:

1. **File Ingestion**:
   - Base64 encoding
   - MIME type detection
   - Size validation

2. **Content Extraction**:
   - PDF text extraction (pdfplumber)
   - Document parsing
   - Text normalization

3. **Analysis Pipeline**:
   - Key point identification
   - Topic clustering
   - Sentiment analysis

4. **Insight Generation**:
   - Executive summary creation
   - Critical finding highlighting
   - Actionable recommendation formulation

5. **Output Formatting**:
   - Markdown structuring
   - Section organization
   - Readability optimization

### 9.3 Data Transformation Pipeline

#### Input Processing:
```python
# Example transformation pipeline
def process_research_input(topic: str, is_deep: bool) -> Dict[str, Any]:
    """Transform user input into structured research state"""
    return {
        "topic": topic,
        "is_deep": is_deep,
        "plan": [],  # Will be populated by Editor Agent
        "context": [],  # Will be populated by Researcher Agent
        "sources": [],  # Will be populated by various agents
        "images": [],  # Will be populated by Image Agent
        "report": ""  # Will be populated by Writer Agent
    }
```

#### Intermediate Data Structures:
```python
# Research context data
class ResearchContext:
    text_content: str
    sources: List[Dict[str, str]]  # [{"title": "...", "uri": "..."}]
    images: List[str]  # Image URLs
    metadata: Dict[str, Any]  # Additional context data

# Report structure
class ReportStructure:
    executive_summary: str
    introduction: str
    detailed_analysis: List[Dict[str, str]]  # [{"heading": "...", "content": "..."}]
    key_findings: List[str]
    implications: str
    conclusions: str
    recommendations: List[str]
```

#### Output Processing:
```python
# Final report formatting
def format_final_report(report_structure: ReportStructure) -> str:
    """Convert structured report into Markdown format"""
    markdown_report = f"""# {report_structure.title}

## Executive Summary
{report_structure.executive_summary}

## Introduction
{report_structure.introduction}

## Detailed Analysis
"""
    
    for section in report_structure.detailed_analysis:
        markdown_report += f"### {section['heading']}\n{section['content']}\n\n"
    
    markdown_report += f"""## Key Findings
"""
    
    for finding in report_structure.key_findings:
        markdown_report += f"- {finding}\n"
    
    markdown_report += f"""
## Implications
{report_structure.implications}

## Conclusions and Recommendations
{report_structure.conclusions}

### Recommendations:
"""
    
    for recommendation in report_structure.recommendations:
        markdown_report += f"- {recommendation}\n"
    
    return markdown_report
```

## 10. Database Management

### 10.1 MongoDB Schema Design

JARVIS uses MongoDB for flexible, scalable data storage with the following collections:

#### Users Collection:
```javascript
// users collection schema
{
  "_id": ObjectId,
  "userId": String,           // Unique user identifier
  "email": String,            // User email from Google OAuth
  "name": String,             // User name from Google OAuth
  "lastActive": Date,         // Last activity timestamp
  "preferences": {
    "theme": String,          // UI theme preference
    "language": String,       // Language preference
    "notifications": Boolean  // Notification settings
  },
  "createdAt": Date,          // Account creation timestamp
  "updatedAt": Date           // Last update timestamp
}
```

#### Activity Logs Collection:
```javascript
// activity_logs collection schema
{
  "_id": ObjectId,
  "userId": String,           // Reference to users collection
  "userEmail": String,        // User email for easy querying
  "timestamp": Date,          // Activity timestamp
  "actionType": String,       // QUICK_SEARCH, DEEP_RESEARCH, DOC_ANALYSIS, NAVIGATE
  "query": String,            // Research topic or query
  "documentName": String,     // For document analysis
  "documentFormat": String,   // MIME type of uploaded document
  "metadata": {
    "sessionId": String,      // Session tracking
    "ipAddress": String,      // User IP for security
    "userAgent": String,      // Browser information
    "duration": Number        // Processing time in milliseconds
  },
  "createdAt": Date           // Log creation timestamp
}
```

### 10.2 Database Operations

#### User Management:
```python
# backend/server.py
async def update_user_activity(user_id: str, email: str = None):
    """Update user's last active time and email"""
    if mongo_client is None or users_collection is None:
        logger.warning("MongoDB client not initialized")
        return
    
    try:
        # Update user's last active time and email if provided
        user_data = {
            "userId": user_id,
            "lastActive": datetime.utcnow()
        }
        
        # Add email if provided
        if email:
            user_data["email"] = email
        
        # Upsert user record
        users_collection.update_one(
            {"userId": user_id},
            {"$set": user_data},
            upsert=True
        )
        
        logger.info(f"Updated user activity for {user_id}")
    except Exception as e:
        logger.error(f"Failed to update user activity: {e}")
```

#### Activity Logging:
```python
# backend/server.py
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
```

#### History Retrieval:
```python
# backend/server.py
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
```

### 10.3 Indexing Strategy

To optimize database performance, the following indexes are created:

```python
# backend/server.py
# Create indexes for better performance
activity_collection.create_index("userId")
activity_collection.create_index("timestamp")
activity_collection.create_index([("userId", 1), ("timestamp", -1)])
activity_collection.create_index("actionType")
activity_collection.create_index("query")
```

### 10.4 Data Privacy and Security

#### Data Protection Measures:
1. **PII Handling**:
   - Minimal personal data storage
   - Email only stored for user identification
   - No sensitive information retained

2. **Data Retention**:
   - Activity logs retained for 90 days
   - Automatic cleanup of old records
   - User data preserved indefinitely

3. **Access Control**:
   - Role-based access to database
   - Secure connection strings
   - Environment-based configuration

## 11. Frontend Implementation

### 11.1 Component Architecture

The frontend follows a modular component architecture with clear separation of concerns:

#### Page Components:
1. **HomePage.tsx**: Main navigation and input interface
2. **LoginPage.tsx**: Authentication flow
3. **QuickResultPage.tsx**: Quick research results display
4. **DeepResearchPage.tsx**: Deep research results and chat
5. **DocAnalysisPage.tsx**: Document analysis interface

#### UI Components:
1. **ResearchLogs.tsx**: Real-time agent activity feed
2. **MarkdownRenderer.tsx**: Rich text report display
3. **ChatPanel.tsx**: Interactive AI assistant
4. **WaveLoader.tsx**: Animated loading indicators
5. **FileUploader.tsx**: Document upload widget

#### Service Layer:
1. **agentSystem.ts**: Research workflow orchestration
2. **llmProvider.ts**: LLM abstraction and fallback
3. **searchProvider.ts**: Search service integration
4. **analysisService.ts**: Document analysis and Q&A
5. **apiClient.ts**: Backend API communication
6. **config.ts**: Configuration management
7. **mongoService.ts**: Activity logging
8. **exportService.ts**: Report export functionality

### 11.2 State Management

The frontend uses React's useState and useEffect hooks for state management, with a custom event system for agent communication:

```typescript
// services/agentSystem.ts
export class ResearchWorkflow {
  private listeners: ((event: AgentEvent) => void)[] = [];

  public subscribe(callback: (event: AgentEvent) => void) {
    this.listeners.push(callback);
    return () => { this.listeners = this.listeners.filter(cb => cb !== callback); };
  }

  private emit(event: AgentEvent) {
    this.listeners.forEach(cb => cb(event));
  }

  public async start(topic: string, isDeep: boolean) {
    // Initialize agents
    const editor = new EditorAgent(this.emit.bind(this));
    const researcher = new ResearcherAgent(this.emit.bind(this));
    const imager = new ImageAgent(this.emit.bind(this));
    const sourcer = new SourceAgent(this.emit.bind(this));
    const writer = new WriterAgent(this.emit.bind(this));
    const publisher = new PublisherAgent(this.emit.bind(this));

    // Create initial state
    const initialState: AgentState = {
      topic,
      isDeep,
      plan: [],
      context: [],
      sources: [],
      images: [],
      report: ""
    };

    // Execute agent pipeline
    try {
      this.emit({ type: 'log', message: `Starting ${isDeep ? 'Deep' : 'Quick'} Research on: ${topic}`, timestamp: new Date() });
      
      // Stage 1: Planning
      const plannedState = await editor.execute(initialState);
      
      // Stage 2: Research
      const researchedState = await researcher.execute(plannedState);
      
      // Stage 3: Image Extraction
      const imagedState = await imager.execute(researchedState);
      
      // Stage 4: Source Processing
      const sourcedState = await sourcer.execute(imagedState);
      
      // Stage 5: Writing
      const writtenState = await writer.execute(sourcedState);
      
      // Stage 6: Publishing
      const finalState = await publisher.execute(writtenState);
      
      this.emit({ type: 'log', message: 'Research Pipeline Completed Successfully', timestamp: new Date() });
      return finalState;
    } catch (e: any) {
      console.error("Pipeline Error", e);
      this.emit({ type: 'error', message: `Pipeline crashed: ${e.message}`, timestamp: new Date() });
      throw e;
    }
  }
}
```

### 11.3 Real-time Updates

The frontend implements real-time updates through a custom event system that mirrors the backend agent communication:

```typescript
// types.ts
export interface AgentEvent {
  type: 'log' | 'agent_action' | 'plan' | 'search' | 'image' | 'source' | 'report_chunk' | 'complete' | 'error';
  agentName?: string;
  message: string;
  data?: any;
  timestamp: Date;
}

export interface AgentState {
  topic: string;
  isDeep: boolean;
  plan: string[];
  context: string[];
  sources: Source[];
  images: string[];
  report: string;
}
```

### 11.4 Responsive Design

The UI is built with TailwindCSS for responsive design that works across devices:

```tsx
// HomePage.tsx (responsive design example)
<div className="w-full relative group perspective-1000">
  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
  
  <div className="relative bg-[#0F1629]/80 backdrop-blur-lg border border-white/10 rounded-xl p-1.5 shadow-xl overflow-hidden transition-all duration-300 ring-1 ring-white/5 hover:ring-cyan-500/20">
    
    {activeTab !== 'DOCS' ? (
      <div className="flex items-center">
         <div className="pl-4 pr-3">
           <SearchIcon className={`w-5 h-5 transition-colors duration-300 ${activeTab === 'QUICK' ? 'text-amber-400' : 'text-cyan-400'}`} />
         </div>
         <input 
           autoFocus
           value={query}
           onChange={(e) => setQuery(e.target.value)}
           onKeyDown={(e) => e.key === 'Enter' && handleLaunch()}
           placeholder={activeTab === 'QUICK' ? "Quick search..." : "Deep research..."}
           className="flex-1 bg-transparent border-none outline-none text-base text-white placeholder-slate-500 py-4 font-light"
         />
         <button 
           onClick={() => handleLaunch()}
           disabled={!query.trim()}
           className="mx-1.5 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-lg hover:shadow-[0_0_20px_rgba(6,182,212,0.5)] hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none disabled:scale-100 shadow-md border border-white/10 tracking-wide text-sm"
         >
           SEARCH
         </button>
      </div>
    ) : (
      <div className="p-3">
         <FileUploader onFileSelect={(file) => handleLaunch(file)} isLoading={false} />
      </div>
    )}
    
  </div>
</div>
```

## 12. Deployment & Environment Configuration

### 12.1 Render.com Deployment

JARVIS is designed for deployment on Render.com with the following configuration:

#### Render YAML Configuration:
```yaml
# render.yaml
services:
  - type: web
    name: jarvis-backend
    env: python
    plan: free
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn backend.server:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: PYTHON_VERSION
        value: 3.9.16
      - key: GOOGLE_API_KEY
        sync: true
      - key: GROQ_API_KEY
        sync: true
      - key: TAVILY_API_KEY
        sync: true
      - key: HUGGINGFACE_API_KEY
        sync: true
      - key: GOOGLE_CLIENT_ID
        sync: true
      - key: GOOGLE_CLIENT_SECRET
        sync: true
      - key: SESSION_SECRET_KEY
        sync: true
      - key: JWT_SECRET_KEY
        sync: true
      - key: MONGODB_URI
        sync: true
      - key: CORS_ORIGINS
        sync: true
      - key: FRONTEND_URL
        sync: true

  - type: web
    name: jarvis-frontend
    env: static
    buildCommand: npm run build
    staticPublishPath: ./dist
    envVars:
      - key: NODE_VERSION
        value: 18
```

### 12.2 Environment Variables

#### Required Environment Variables:
```bash
# API Keys (Required)
GOOGLE_API_KEY=your_google_gemini_api_key
GROQ_API_KEY=your_groq_api_key
TAVILY_API_KEY=your_tavily_api_key
HUGGINGFACE_API_KEY=your_huggingface_api_key

# OAuth Credentials (Required for Authentication)
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret

# Security Keys (Required)
SESSION_SECRET_KEY=your_session_secret_key
JWT_SECRET_KEY=your_jwt_secret_key

# Database (Required for Production)
MONGODB_URI=your_mongodb_connection_string

# Application Configuration
PORT=8002
FRONTEND_PORT=5173
FRONTEND_URL=https://your-frontend-domain.com
CORS_ORIGINS=https://your-frontend-domain.com,http://localhost:5173

# Optional Provider Configuration
GROQ_MODEL=llama-3.1-8b-instant
GROQ_API_URL=https://api.groq.com/openai/v1/chat/completions
GEMINI_API_URL=https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent
HUGGINGFACE_MODELS=mistralai/Mistral-7B-Instruct-v0.2,HuggingFaceH4/zephyr-7b-beta,google/gemma-2b-it
```

### 12.3 Production vs Development Configuration

#### Development Environment:
```bash
# .env.development
GOOGLE_API_KEY=your_dev_google_api_key
GROQ_API_KEY=your_dev_groq_api_key
TAVILY_API_KEY=your_dev_tavily_api_key
HUGGINGFACE_API_KEY=your_dev_huggingface_api_key

GOOGLE_CLIENT_ID=your_dev_google_client_id
GOOGLE_CLIENT_SECRET=your_dev_google_client_secret

SESSION_SECRET_KEY=dev_session_secret
JWT_SECRET_KEY=dev_jwt_secret

MONGODB_URI=mongodb://localhost:27017/jarvis_dev

PORT=8002
FRONTEND_PORT=5173
FRONTEND_URL=http://localhost:5173
CORS_ORIGINS=http://localhost:5173,http://localhost:8002
```

#### Production Environment:
```bash
# Render Environment Variables (configured in dashboard)
GOOGLE_API_KEY=${GOOGLE_API_KEY}
GROQ_API_KEY=${GROQ_API_KEY}
TAVILY_API_KEY=${TAVILY_API_KEY}
HUGGINGFACE_API_KEY=${HUGGINGFACE_API_KEY}

GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}

SESSION_SECRET_KEY=${SESSION_SECRET_KEY}
JWT_SECRET_KEY=${JWT_SECRET_KEY}

MONGODB_URI=${MONGODB_URI}

PORT=$PORT
FRONTEND_PORT=5173
FRONTEND_URL=https://jarvis-l8gx.onrender.com
CORS_ORIGINS=https://jarvis-l8gx.onrender.com
```

### 12.4 Docker Deployment (Optional)

For containerized deployment, Dockerfiles can be created:

#### Backend Dockerfile:
```dockerfile
# Dockerfile.backend
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

EXPOSE 8002

CMD ["uvicorn", "backend.server:app", "--host", "0.0.0.0", "--port", "8002"]
```

#### Frontend Dockerfile:
```dockerfile
# Dockerfile.frontend
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

EXPOSE 80

CMD ["npm", "run", "preview"]
```

## 13. Testing Strategy

### 13.1 Automated Testing Framework

JARVIS implements comprehensive testing using Playwright for end-to-end testing:

#### Test Suite Structure:
```
tests/
├── quickResearchTest.spec.js
├── deepResearchTest.spec.js
├── docAnalysisTest.spec.js
├── authenticationTest.spec.js
├── llmFallbackTest.spec.js
├── reportGenerationTest.spec.js
├── loadingStateTest.spec.js
└── deploymentVerification.spec.js
```

#### Sample Test Case:
```javascript
// tests/quickResearchTest.spec.js
import { test, expect } from '@playwright/test';

test('Test Quick Research Functionality', async ({ page }) => {
  console.log("=== QUICK RESEARCH FUNCTIONALITY TEST ===");
  
  // Navigate to the JARVIS website
  await page.goto('https://jarvis-l8gx.onrender.com');
  
  // Wait for the page to load
  await page.waitForTimeout(5000);
  
  // Check API configuration
  const logs = await page.evaluate(() => {
    const logs = [];
    const originalLog = console.log;
    console.log = function(...args) {
      logs.push(args.join(' '));
      originalLog.apply(console, args);
    };
    
    // Trigger config status log
    if (typeof window.logConfigStatus === 'function') {
      window.logConfigStatus();
    }
    
    console.log = originalLog; // Restore original console.log
    return logs;
  });
  
  // Check for API URL in logs
  const apiLogs = logs.filter(log => log.includes('API URL:'));
  console.log("API Configuration Logs:", apiLogs);
  
  const correctApiUrl = apiLogs.some(log => log.includes('jarvis-backend-nzcg.onrender.com'));
  if (correctApiUrl) {
    console.log("✅ API URL correctly configured");
  } else {
    console.log("❌ API URL configuration issue");
  }
  
  // Perform Quick Research
  console.log("=== PERFORMING QUICK RESEARCH ===");
  
  // Fill in research topic
  await page.fill('[placeholder="Enter a topic to research..."]', 'messi');
  
  // Click Quick Research button
  await page.click('button:has-text("Quick Research")');
  
  // Wait and observe the research process
  console.log("Waiting for research to start...");
  await page.waitForTimeout(10000);
  
  // Check for research progress indicators
  const progressIndicators = await page.locator('text=Starting').count();
  const planningIndicators = await page.locator('text=Planning').count();
  const searchingIndicators = await page.locator('text=Searching').count();
  const draftingIndicators = await page.locator('text=Drafting').count();
  
  console.log(`Progress indicators found: ${progressIndicators}`);
  console.log(`Planning indicators found: ${planningIndicators}`);
  console.log(`Searching indicators found: ${searchingIndicators}`);
  console.log(`Drafting indicators found: ${draftingIndicators}`);
  
  // Check for error messages
  const errorMessages = await page.locator('text=failed').count();
  const errorMessageTexts = [];
  for (let i = 0; i < Math.min(errorMessages, 3); i++) {
    const errorText = await page.locator('text=failed').nth(i).textContent();
    errorMessageTexts.push(errorText);
  }
  
  if (errorMessages > 0) {
    console.log("❌ Error messages detected:");
    errorMessageTexts.forEach((msg, idx) => console.log(`  ${idx + 1}. ${msg}`));
  } else {
    console.log("✅ No error messages detected");
  }
  
  // Take a screenshot for visual verification
  await page.screenshot({ path: 'quick-research-test-result.png' });
  console.log("Screenshot saved as quick-research-test-result.png");
  
  console.log("=== QUICK RESEARCH TEST COMPLETED ===");
});
```

### 13.2 Unit Testing

Backend components can be tested with pytest:

```python
# tests/test_llm_utils.py
import pytest
from unittest.mock import patch, MagicMock
from backend.llm_utils import generate_llm_content

def test_generate_llm_content_success():
    """Test successful LLM content generation"""
    with patch('os.getenv') as mock_getenv:
        mock_getenv.return_value = 'fake-api-key'
        
        with patch('requests.post') as mock_post:
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.json.return_value = {
                "candidates": [{
                    "content": {
                        "parts": [{
                            "text": "Test response content"
                        }]
                    }
                }]
            }
            mock_post.return_value = mock_response
            
            result = generate_llm_content("Test prompt")
            assert result["content"] == "Test response content"
            assert result["provider"] == "Google Gemini"

def test_generate_llm_content_fallback():
    """Test fallback mechanism when primary provider fails"""
    with patch('os.getenv') as mock_getenv:
        # Mock multiple API keys
        def side_effect(key):
            if key == "GOOGLE_API_KEY":
                return "fake-google-key"
            elif key == "GROQ_API_KEY":
                return "fake-groq-key"
            return None
        
        mock_getenv.side_effect = side_effect
        
        with patch('requests.post') as mock_post:
            # First call fails (Google), second succeeds (Groq)
            mock_response_fail = MagicMock()
            mock_response_fail.raise_for_status.side_effect = Exception("Authentication failed")
            
            mock_response_success = MagicMock()
            mock_response_success.status_code = 200
            mock_response_success.json.return_value = {
                "choices": [{
                    "message": {
                        "content": "Fallback response content"
                    }
                }]
            }
            
            mock_post.side_effect = [mock_response_fail, mock_response_success]
            
            result = generate_llm_content("Test prompt")
            assert result["content"] == "Fallback response content"
            assert result["provider"] == "Groq"
```

### 13.3 Performance Testing

Load testing can be implemented with tools like Artillery:

```yaml
# load-test.yaml
config:
  target: "https://jarvis-backend-nzcg.onrender.com"
  phases:
    - duration: 60
      arrivalRate: 5
  defaults:
    headers:
      content-type: "application/json"

scenarios:
  - name: "Quick Research Load Test"
    flow:
      - post:
          url: "/api/research"
          json:
            topic: "Artificial Intelligence"
            is_deep: false
          capture:
            json: "$.report"
            as: "report"
      - log: "Generated report length: {{ report.length }} characters"
```

## 14. Performance Optimization

### 14.1 Caching Strategies

#### LLM Response Caching:
```python
# backend/llm_utils.py (enhanced with caching)
import hashlib
import json
from functools import lru_cache

# Simple in-memory cache for demonstration
@lru_cache(maxsize=128)
def _cached_llm_call(cache_key: str, prompt: str, system_instruction: str = "", is_report: bool = False) -> str:
    """Cached LLM call - in production, use Redis or similar"""
    # Actual LLM call implementation
    pass

def generate_llm_content(prompt: str, system_instruction: str = "", is_report: bool = False, provider: Optional[str] = None) -> Dict[str, Any]:
    """Generate content using LLM with caching and fallback providers"""
    
    # Create cache key
    cache_key_data = {
        "prompt": prompt,
        "system_instruction": system_instruction,
        "is_report": is_report,
        "provider": provider
    }
    cache_key = hashlib.md5(json.dumps(cache_key_data, sort_keys=True).encode()).hexdigest()
    
    # Try cache first
    try:
        cached_result = _cached_llm_call(cache_key, prompt, system_instruction, is_report)
        if cached_result:
            logger.info("Returning cached LLM response")
            return {"content": cached_result, "provider": "Cache", "cached": True}
    except Exception as e:
        logger.warning(f"Cache lookup failed: {e}")
    
    # Proceed with normal LLM generation (existing implementation)
```

### 14.2 Asynchronous Processing

#### Concurrent Research Tasks:
```python
# backend/agents/researcher_agent.py (enhanced with concurrency)
import asyncio
from concurrent.futures import ThreadPoolExecutor

class ResearcherAgent(BaseAgent):
    def __init__(self):
        super().__init__("Researcher")
        self.tavily_api_key = os.getenv("TAVILY_API_KEY")
        self.executor = ThreadPoolExecutor(max_workers=5)  # Limit concurrent requests
    
    async def execute(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """Perform web research with concurrent processing"""
        topic = state.get("topic", "")
        plan = state.get("plan", [])
        
        logger.info(f"[{self.name}] Starting concurrent research on {len(plan)} queries")
        
        # Process multiple search queries concurrently
        tasks = []
        for query in plan:
            task = asyncio.create_task(self._process_single_query(query))
            tasks.append(task)
        
        # Wait for all tasks to complete with timeout
        try:
            results = await asyncio.wait_for(asyncio.gather(*tasks, return_exceptions=True), timeout=30.0)
        except asyncio.TimeoutError:
            logger.warning(f"[{self.name}] Research timeout - some queries may not have completed")
            results = []
        
        # Process results
        context = []
        sources = []
        images = []
        
        for result in results:
            if isinstance(result, Exception):
                logger.warning(f"[{self.name}] Query failed: {str(result)}")
                continue
            if result:
                context.extend(result.get("context", []))
                sources.extend(result.get("sources", []))
                images.extend(result.get("images", []))
        
        # Update state
        state["context"] = context
        state["sources"] = sources
        state["images"] = list(set(images))  # Deduplicate images
        
        logger.info(f"[{self.name}] Research completed with {len(sources)} sources")
        return state
    
    async def _process_single_query(self, query: str) -> Dict[str, Any]:
        """Process a single search query"""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(self.executor, self._sync_search, query)
    
    def _sync_search(self, query: str) -> Dict[str, Any]:
        """Synchronous search implementation"""
        # Existing search implementation
        pass
```

### 14.3 Memory Optimization

#### Streaming Responses:
```python
# backend/server.py (streaming endpoint)
from fastapi.responses import StreamingResponse

@app.post("/api/llm/stream")
async def stream_llm_content(request: LLMRequest):
    """Stream LLM content generation"""
    
    async def generate_stream():
        try:
            from backend.llm_utils import generate_llm_content
            result = generate_llm_content(
                prompt=request.prompt,
                system_instruction=request.system_instruction,
                is_report=bool(request.is_report),
                provider=request.provider
            )
            
            # Stream content in chunks
            content = result.get("content", "")
            chunk_size = 100
            for i in range(0, len(content), chunk_size):
                chunk = content[i:i + chunk_size]
                yield f"data: {json.dumps({'chunk': chunk})}\n\n"
                await asyncio.sleep(0.01)  # Small delay to simulate streaming
            
            # Send completion signal
            yield f"data: {json.dumps({'done': True})}\n\n"
            
        except Exception as e:
            logger.error(f"Streaming failed: {str(e)}")
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
    
    return StreamingResponse(generate_stream(), media_type="text/event-stream")
```

## 15. Security Considerations

### 15.1 Input Validation

#### Sanitization and Validation:
```python
# backend/server.py
from pydantic import validator

class ResearchRequest(BaseModel):
    topic: str
    is_deep: bool
    
    @validator('topic')
    def validate_topic
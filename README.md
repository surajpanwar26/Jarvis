# JARVIS AI Researcher

Multi-Agent AI Research Platform powered by Google Gemini

![JARVIS Logo](Jarvis.ico)

JARVIS is an advanced AI research assistant that leverages multiple specialized agents to conduct comprehensive research, generate detailed reports, and analyze documents. Built with a modern tech stack featuring React, FastAPI, and Google's Gemini AI.

## Features

- **Multi-Agent Architecture**: Specialized agents for research, reporting, document analysis, and more
- **Multiple Research Modes**: Quick Research, Deep Research, and Document Analysis
- **Real-time Visualization**: Watch the AI thought process unfold in real-time
- **Rich Media Integration**: Automatic image fetching and embedding in reports
- **Export Capabilities**: Export research findings to PDF and DOCX formats
- **Secure Authentication**: Google OAuth 2.0 integration for user authentication

## Tech Stack

- **Frontend**: React 18 + Vite + TypeScript
- **Backend**: Python 3.9 + FastAPI + LangGraph
- **AI Models**: Google Gemini 2.5 Flash (primary), Groq (Llama 3)
- **Agent Framework**: Custom Multi-Agent System with specialized agents
- **Authentication**: Google OAuth 2.0

## Prerequisites

- Node.js v18+
- Python 3.9+
- API keys for:
  - Google Gemini
  - Groq
  - Tavily
  - Pexels or Unsplash (for image search)
  - Hugging Face (fallback provider)
  - Google OAuth 2.0 (for authentication)

## Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/JARVIS-AI-Researcher.git
   cd JARVIS-AI-Researcher
   ```

2. Install dependencies:
   ```bash
   # Frontend
   npm install
   
   # Backend
   pip install -r requirements.txt
   ```

3. Configure Google OAuth (if you want authentication):
   - Go to Google Cloud Console
   - Create a new OAuth 2.0 Client ID
   - For local development, add these URIs:
     - Authorized JavaScript origins: `http://localhost:5173`
     - Authorized redirect URIs: `http://localhost:5173/api/callback`
   - For production deployment, add these URIs:
     - Authorized JavaScript origins: `https://jarvis-l8gx.onrender.com`
     - Authorized redirect URIs: `https://jarvis-l8gx.onrender.com/api/callback`
   - Copy the Client ID and Client Secret to your `.env` file

4. Create a `.env` file in the root directory with the following variables:

```env
# Primary Intelligence (Required)
GROQ_API_KEY=your_groq_api_key
VITE_GROQ_API_KEY=your_groq_api_key

# Report Generation & Vision (Highly Recommended)
GOOGLE_API_KEY=your_google_api_key
VITE_GOOGLE_API_KEY=your_google_api_key

# Web Search (Optional)
TAVILY_API_KEY=your_tavily_api_key
VITE_TAVILY_API_KEY=your_tavily_api_key

# Image Search (Choose One)
PEXELS_API_KEY=your_pexels_api_key
VITE_PEXELS_API_KEY=your_pexels_api_key
UNSPLASH_ACCESS_KEY=your_unsplash_access_key
VITE_UNSPLASH_ACCESS_KEY=your_unsplash_access_key

# Fallback Provider
HUGGINGFACE_API_KEY=your_huggingface_api_key
VITE_HUGGINGFACE_API_KEY=your_huggingface_api_key

# Database
MONGODB_URI=your_mongodb_uri

# Authentication
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
SESSION_SECRET_KEY=your_session_secret_key
JWT_SECRET_KEY=your_jwt_secret_key

# API Configuration
API_URL=http://localhost:${PORT:-8002}
VITE_API_URL=http://localhost:${PORT:-8002}

# Port Configuration (Optional)
# PORT=8002
# FRONTEND_PORT=5173
```

5. Run the development servers:
   ```bash
   # Using Docker Compose (recommended)
   docker-compose up
   
   # Or run separately:
   # Terminal 1: Frontend
   npm run dev
   
   # Terminal 2: Backend
   python run_server.py
   ```

## Deployment

### Deploy to Render (Recommended)

This project is optimized for deployment to Render using the `render.yaml` configuration file.

1. Fork this repository to your GitHub account
2. Create a new Web Service on Render
3. Connect it to your forked repository
4. Render will automatically use the `render.yaml` configuration

The `render.yaml` defines two services:
1. **jarvis-backend**: Python service running the FastAPI backend
2. **jarvis-frontend**: Node service serving the React frontend

All required environment variables must be set in the Render dashboard.

### Manual Deployment

#### Backend
```bash
cd backend
pip install -r requirements.txt
python run_server.py
```

#### Frontend
```bash
npm install
npm run build
npm run preview
```

## Project Structure

```
├── backend/              # FastAPI backend
│   ├── agents/           # Multi-agent system
│   ├── search/           # Search utilities
│   └── server.py         # Main server file
├── components/           # React components
├── pages/                # Page components
├── services/             # Frontend services
├── .env.example          # Environment variable template
├── package.json          # Frontend dependencies
├── requirements.txt      # Backend dependencies
├── render.yaml           # Render deployment configuration
└── vite.config.ts        # Vite configuration
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
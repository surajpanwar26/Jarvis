import os
from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import JSONResponse, RedirectResponse, HTMLResponse
from authlib.integrations.starlette_client import OAuth
from starlette.config import Config
from starlette.middleware.sessions import SessionMiddleware
from typing import Optional
import jwt
from datetime import datetime, timedelta
from dotenv import load_dotenv
from pymongo import MongoClient
import urllib.parse
import hashlib

# Load environment variables
load_dotenv()

# Initialize OAuth
config = Config(environ=os.environ)
oauth = OAuth(config)

# Register Google OAuth
print("Registering Google OAuth client...")
print(f"GOOGLE_CLIENT_ID: {os.getenv('GOOGLE_CLIENT_ID')}")
print(f"GOOGLE_CLIENT_SECRET: {'*' * len(os.getenv('GOOGLE_CLIENT_SECRET', '')) if os.getenv('GOOGLE_CLIENT_SECRET') else 'Not set'}")

oauth.register(
    name='google',
    client_id=os.getenv('GOOGLE_CLIENT_ID'),
    client_secret=os.getenv('GOOGLE_CLIENT_SECRET'),
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={
        'scope': 'openid email profile'
    }
)

# Create router
router = APIRouter(prefix="/auth", tags=["Authentication"])

# JWT settings
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# MongoDB connection
MONGODB_URI = os.getenv("MONGODB_URI")
mongo_client = None
users_collection = None

if MONGODB_URI:
    try:
        # Handle both SRV and standard URI formats
        encoded_uri = MONGODB_URI  # Use as-is for multi-host URIs
        
        # Only parse and encode if it's a simple URI (not multi-host)
        if "," not in MONGODB_URI and "@" in MONGODB_URI:
            try:
                parsed_uri = urllib.parse.urlparse(MONGODB_URI)
                username = parsed_uri.username
                password = parsed_uri.password
                
                # Only encode if both username and password exist
                if username and password:
                    # Encode username and password
                    encoded_username = urllib.parse.quote_plus(username)
                    encoded_password = urllib.parse.quote_plus(password)
                    
                    # Reconstruct URI with encoded credentials
                    encoded_uri = MONGODB_URI.replace(
                        f"{username}:{password}",
                        f"{encoded_username}:{encoded_password}"
                    )
            except Exception as e:
                print(f"Error encoding MongoDB credentials: {e}")
        
        mongo_client = MongoClient(encoded_uri)
        db = mongo_client.jarvis_db
        users_collection = db.users
        print("Connected to MongoDB")
    except Exception as e:
        print(f"Failed to connect to MongoDB: {e}")

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def generate_user_id(email: str) -> str:
    """Generate a consistent user ID based on email"""
    return hashlib.sha256(email.lower().encode()).hexdigest()

@router.get("/google")
async def login_via_google_alias(request: Request):
    """Alias for Google OAuth login to handle /api/auth/google path"""
    print("OAuth login request received at /api/auth/google")
    return await login_via_google(request)

@router.get("/login")
async def login_via_google(request: Request):
    """Initiate Google OAuth login"""
    # Log request information for debugging
    host = request.headers.get("host", "")
    origin = request.headers.get("origin", "")
    referer = request.headers.get("referer", "")
    
    print(f"OAuth login request - Host: {host}, Origin: {origin}, Referer: {referer}")
    
    # Determine if this is a production environment
    is_production = "jarvis-backend-nzcg.onrender.com" in host
    
    # Determine the correct redirect URI based on environment variables or request origin
    # Check if we have an explicit redirect URI set in environment variables (highest priority)
    redirect_uri = os.getenv("GOOGLE_REDIRECT_URI")
    
    print(f"Using redirect URI from env var: {redirect_uri}")
    
    if not redirect_uri:
        # If no explicit redirect URI, determine based on environment
        if is_production:
            # Use the production backend URL to match Google Console configuration
            redirect_uri = "https://jarvis-backend-nzcg.onrender.com/api/auth/google/callback"
        else:
            # Use localhost backend port
            redirect_uri = f"http://localhost:{os.getenv('PORT', '8002')}/api/auth/google/callback"
        
        print(f"Generated redirect URI: {redirect_uri}")
    else:
        print(f"Using explicit redirect URI: {redirect_uri}")
        # Validate that the redirect URI matches expected format for the environment
        if is_production and not redirect_uri.startswith("https://jarvis-backend-nzcg.onrender.com"):
            print(f"WARNING: Production redirect URI mismatch! Got: {redirect_uri}")
            # Override with correct production URI to prevent issues
            redirect_uri = "https://jarvis-backend-nzcg.onrender.com/api/auth/google/callback"
        elif not is_production and not redirect_uri.startswith("http://localhost"):
            print(f"WARNING: Development redirect URI mismatch! Got: {redirect_uri}")
    
    try:
        # Force account selection by adding prompt parameter
        print(f"Attempting OAuth redirect with redirect_uri: {redirect_uri}")
        return await oauth.google.authorize_redirect(
            request, 
            redirect_uri,
            prompt='select_account'
        )
    except Exception as e:
        print(f"OAuth redirect failed: {str(e)}")
        # Return an error response instead of letting it fall through
        raise HTTPException(status_code=500, detail=f"Failed to initiate OAuth: {str(e)}")

# Add catch-all route for debugging OAuth issues
@router.get("/google/callback")
async def auth_via_google_alias(request: Request):
    """Alias for Google OAuth callback to match Google Console configuration"""
    print("OAuth callback received at /api/auth/google/callback")
    print(f"Request query params: {dict(request.query_params)}")
    return await auth_via_google(request)

# Add another alias for the callback
@router.get("/callback")
async def auth_via_google(request: Request):
    """Handle Google OAuth callback"""
    print("OAuth callback received at /api/auth/google/callback")
    print(f"Request query params: {dict(request.query_params)}")
    try:
        # Get user info from Google
        token = await oauth.google.authorize_access_token(request)
        user = token.get('userinfo')
        
        if not user:
            raise HTTPException(status_code=400, detail="Failed to get user info from Google")
        
        # Create JWT token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user["email"], "name": user.get("name", ""), "picture": user.get("picture", "")},
            expires_delta=access_token_expires
        )
        
        # Store user info in session
        request.session['user'] = dict(user)
        request.session['jwt_token'] = access_token
        
        # Store user in MongoDB if connection is available
        if mongo_client is not None and users_collection is not None and user.get("email"):
            try:
                # Generate user ID based on email (consistent with existing schema)
                user_id = generate_user_id(user["email"])
                
                user_data = {
                    "userId": user_id,
                    "email": user["email"],
                    "name": user.get("name", ""),
                    "picture": user.get("picture", ""),
                    "lastActive": datetime.utcnow(),
                    "createdAt": datetime.utcnow()
                }
                
                # Use upsert to create or update user
                users_collection.update_one(
                    {"userId": user_id},
                    {"$set": user_data},
                    upsert=True
                )
                print(f"Stored user {user['email']} with ID {user_id} in MongoDB")
            except Exception as e:
                print(f"Failed to store user in MongoDB: {e}")
        
        # Determine redirect URL based on environment
        origin = request.headers.get("origin", "")
        referer = request.headers.get("referer", "")
        
        # Check if this is a production environment
        is_production = "jarvis-backend-nzcg.onrender.com" in request.headers.get("host", "")
        
        if is_production:
            # Redirect to production frontend
            redirect_url = "https://jarvis-l8gx.onrender.com"
        else:
            # Redirect to development frontend
            # Use the FRONTEND_PORT environment variable or default to 5173
            frontend_port = os.getenv('FRONTEND_PORT', '5173')
            redirect_url = origin or referer or f"http://localhost:{frontend_port}"
        
        print(f"Redirecting user to: {redirect_url}")
        
        # Return HTML that communicates with parent window and redirects
        html_content = """
        <!DOCTYPE html>
        <html>
        <head>
            <title>Authentication Success</title>
        </head>
        <body>
            <script>
                // Store token and email in localStorage
                localStorage.setItem('authToken', '""" + access_token + """');
                localStorage.setItem('jarvis_user_email', '""" + user["email"] + """');
                
                // Communicate with parent window if this is a popup
                if (window.opener) {
                    window.opener.postMessage({
                        type: 'oauth-success',
                        token: '""" + access_token + """'
                    }, '*');
                    window.close();
                } else {
                    // Redirect to main application
                    window.location.href = '""" + redirect_url + """';
                }
            </script>
            <p>Authentication successful. Redirecting...</p>
        </body>
        </html>
        """
        return HTMLResponse(content=html_content)
        
    except Exception as e:
        print(f"Authentication failed: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Authentication failed: {str(e)}")

# Catch-all route removed for debugging OAuth issues

@router.get("/logout")
async def logout(request: Request):
    """Logout user"""
    # Clear session data
    request.session.pop('user', None)
    request.session.pop('jwt_token', None)
    
    # Return a response that indicates successful logout
    return {"message": "Successfully logged out", "logged_out": True}

@router.get("/user")
async def get_current_user(request: Request):
    """Get current user info"""
    user = request.session.get('user')
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return {"user": user}
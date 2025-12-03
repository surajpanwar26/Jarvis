import sys
import os

# Add the current directory to the Python path
sys.path.append(os.path.dirname(__file__))

# Import and run the server
from backend.server import app

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8001))
    uvicorn.run("backend.server:app", host="0.0.0.0", port=port, reload=False)
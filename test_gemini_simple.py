import requests
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_gemini_api_simple():
    """
    Simple test to check if the Google Gemini API key is working
    """
    api_key = os.getenv("GOOGLE_API_KEY")
    
    if not api_key:
        print("Error: GOOGLE_API_KEY not found in environment variables")
        return False
    
    print(f"Testing Google Gemini API key: {api_key[:10]}...")
    
    # Test URL for Gemini API
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
    
    # Very simple test payload
    payload = {
        "contents": [{
            "parts": [{
                "text": "Hello"
            }]
        }]
    }
    
    headers = {
        "Content-Type": "application/json"
    }
    
    try:
        print("Sending simple test request...")
        response = requests.post(url, json=payload, headers=headers, timeout=30)
        
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            print("✅ SUCCESS: API key is working!")
            return True
        elif response.status_code == 429:
            print("❌ QUOTA LIMIT HIT: API key has reached its quota limit")
            return False
        else:
            print(f"❌ ERROR: Status code {response.status_code}")
            print(f"Response: {response.text[:200]}...")
            return False
            
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        return False

if __name__ == "__main__":
    print("Simple Google Gemini API Key Test")
    print("=" * 35)
    test_gemini_api_simple()
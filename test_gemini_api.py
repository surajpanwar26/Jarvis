import requests
import os
from dotenv import load_dotenv
import json

# Load environment variables
load_dotenv()

def test_gemini_api():
    """
    Test if the Google Gemini API key is working or if limits have been hit
    """
    api_key = os.getenv("GOOGLE_API_KEY")
    
    if not api_key:
        print("Error: GOOGLE_API_KEY not found in environment variables")
        return False
    
    print(f"Testing Google Gemini API key: {api_key[:10]}...")
    
    # Test URL for Gemini API
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
    
    # Simple test payload
    payload = {
        "contents": [{
            "parts": [{
                "text": "Say 'Hello, World!' in 5 different languages."
            }]
        }],
        "generationConfig": {
            "temperature": 0.7,
            "maxOutputTokens": 100
        }
    }
    
    headers = {
        "Content-Type": "application/json"
    }
    
    try:
        print("Sending test request to Google Gemini API...")
        response = requests.post(url, json=payload, headers=headers, timeout=30)
        
        if response.status_code == 200:
            print("✅ SUCCESS: API key is working!")
            try:
                result = response.json()
                # Safely extract the response text
                if "candidates" in result and len(result["candidates"]) > 0:
                    candidate = result["candidates"][0]
                    if "content" in candidate and "parts" in candidate["content"] and len(candidate["content"]["parts"]) > 0:
                        text = candidate["content"]["parts"][0].get("text", "No text found")
                        print(f"Response: {text}")
                    else:
                        print("Response received but no text content found")
                        print(f"Full response: {json.dumps(result, indent=2)[:200]}...")
                else:
                    print("Response received but no candidates found")
                    print(f"Full response: {json.dumps(result, indent=2)[:200]}...")
            except Exception as e:
                print(f"Could not parse response content: {str(e)}")
                print(f"Raw response: {response.text[:200]}...")
            return True
        elif response.status_code == 429:
            print("❌ QUOTA LIMIT HIT: API key has reached its quota limit")
            print(f"Error details: {response.text}")
            return False
        elif response.status_code == 400:
            print("❌ BAD REQUEST: There might be an issue with the API key or request format")
            print(f"Error details: {response.text}")
            return False
        elif response.status_code == 403:
            print("❌ FORBIDDEN: API key might be invalid or not authorized")
            print(f"Error details: {response.text}")
            return False
        else:
            print(f"❌ UNEXPECTED ERROR: Status code {response.status_code}")
            print(f"Error details: {response.text}")
            return False
            
    except requests.exceptions.Timeout:
        print("❌ TIMEOUT: Request timed out")
        return False
    except requests.exceptions.ConnectionError:
        print("❌ CONNECTION ERROR: Could not connect to the API")
        return False
    except Exception as e:
        print(f"❌ UNEXPECTED ERROR: {str(e)}")
        return False

if __name__ == "__main__":
    print("Google Gemini API Key Test")
    print("=" * 30)
    test_gemini_api()
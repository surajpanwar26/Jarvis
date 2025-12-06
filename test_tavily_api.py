import requests
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_tavily_api():
    """
    Test if the Tavily API key is working
    """
    api_key = os.getenv("TAVILY_API_KEY")
    
    if not api_key:
        print("Error: TAVILY_API_KEY not found in environment variables")
        return False
    
    print(f"Testing Tavily API key: {api_key[:10]}...")
    
    # Test URL for Tavily API
    url = "https://api.tavily.com/search"
    
    # Simple test payload
    payload = {
        "api_key": api_key,
        "query": "What is the capital of France?",
        "search_depth": "basic",
        "include_answer": True,
        "max_results": 3
    }
    
    headers = {
        "Content-Type": "application/json"
    }
    
    try:
        print("Sending test request to Tavily API...")
        response = requests.post(url, json=payload, headers=headers, timeout=30)
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ SUCCESS: Tavily API key is working!")
            result = response.json()
            if "answer" in result:
                print(f"Answer: {result['answer']}")
            return True
        elif response.status_code == 401:
            print("❌ UNAUTHORIZED: API key might be invalid")
            print(f"Error details: {response.text}")
            return False
        elif response.status_code == 429:
            print("❌ RATE LIMIT: Too many requests")
            print(f"Error details: {response.text}")
            return False
        elif response.status_code == 432:
            print("❌ CLIENT ERROR (432): This might indicate an issue with the API key or account")
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
    print("Tavily API Key Test")
    print("=" * 20)
    test_tavily_api()
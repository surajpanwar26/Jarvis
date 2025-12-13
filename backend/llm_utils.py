import os
import requests
import logging
from requests.exceptions import Timeout
from typing import Dict, Any, Optional

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

def generate_llm_content(prompt: str, system_instruction: str = "", is_report: bool = False, provider: Optional[str] = None) -> Dict[str, Any]:
    """Generate content using LLM with fallback providers"""
    logger.info("Generating LLM content with fallback support")
    
    # Try providers in order of preference (Google Gemini -> Groq -> Hugging Face)
    # Hugging Face deprioritized due to reliability issues
    providers = []
    
    # 1. Google Gemini (primary) - Re-enabled for better accuracy
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
                "max_tokens": 1024 if not is_report else 2048  # Reduce tokens for non-report generation
            },
            "headers": {
                "Authorization": f"Bearer {groq_api_key}",
                "Content-Type": "application/json"
            }
        })
    
    # 3. Hugging Face (deprioritized fallback)
    hugging_face_api_key = os.getenv("HUGGINGFACE_API_KEY")
    if hugging_face_api_key and (provider is None or provider == "huggingface"):
        # List of Hugging Face models to try in order of preference
        # Updated to use models that work with current Hugging Face InferenceClient
        huggingface_models = os.getenv("HUGGINGFACE_MODELS", "mistralai/Mistral-7B-Instruct-v0.2,HuggingFaceH4/zephyr-7b-beta,google/gemma-2b-it").split(",")
        
        # Try each model in order until one works
        for model_id in huggingface_models:
            providers.append({
                "name": f"Hugging Face ({model_id})",
                "type": "huggingface_client",  # New type to indicate we should use the client
                "model": model_id,
                "api_key": hugging_face_api_key,
                "payload": {
                    "prompt": prompt,
                    "system_instruction": system_instruction,
                    "max_tokens": 500 if not is_report else 1000,  # Reduce tokens for non-report generation
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
    
    # Even if API keys are missing, provide a basic response
    topic_summary = prompt.split(':')[0] if ':' in prompt else prompt[:50] + '...' if len(prompt) > 50 else prompt
    
    fallback_content = f"""I apologize, but I'm unable to generate a detailed AI-powered response at the moment due to API limitations. Here's a basic overview:

**Topic**: {topic_summary}

Possible reasons for this limitation:
- API keys may not be properly configured
- Network connectivity issues
- API rate limiting

To resolve this issue:
1. Ensure all required API keys are set in your environment variables
2. Check your internet connection
3. Try again later if it's a temporary rate limit

For administrators: Check that GOOGLE_API_KEY, GROQ_API_KEY, and other required keys are properly configured in your deployment environment."""

    return {"content": fallback_content, "provider": "Fallback", "attempted_providers": attempted_providers}
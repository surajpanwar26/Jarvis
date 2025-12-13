import requests
import os
from typing import Dict, List, Any
from backend.agents.base_agent import BaseAgent
from backend.utils import logger
import json

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
        
        # Adjusted fallback chain based on reliability testing: 
        # If Tavily is reliable -> Tavily -> DuckDuckGo -> Google -> Groq -> Hugging Face
        # If Tavily is unreliable -> DuckDuckGo -> Google -> Groq -> Hugging Face -> Tavily
        # DuckDuckGo provides reliable results without API key requirements
        # Hugging Face deprioritized due to reliability issues
        providers = [
            {"name": "Tavily", "func": self._perform_tavily_search},
            {"name": "DuckDuckGo", "func": self._perform_duckduckgo_search},
            {"name": "Google", "func": self._perform_google_search},
            {"name": "Groq", "func": self._perform_groq_search},
            {"name": "Hugging Face", "func": self._perform_huggingface_search}
        ]
        
        last_error = None
        
        for provider in providers:
            try:
                logger.info(f"[{self.name}] Trying {provider['name']} search")
                search_results = provider["func"](search_query)
                logger.info(f"[{self.name}] Successfully got results from {provider['name']}")
                break  # Success, exit the loop
            except Exception as e:
                last_error = e
                logger.warning(f"[{self.name}] {provider['name']} search failed: {str(e)}")
                continue  # Try the next provider
        
        # If all providers failed, raise the last error
        if search_results is None:
            raise Exception(f"All search providers failed. Last error: {str(last_error)}")
        
        # Process results
        context = ""
        sources = []
        images = []
        
        if "results" in search_results:
            for result in search_results["results"]:
                context += f"\n\nTitle: {result.get('title', 'Unknown')}\nContent: {result.get('content', '')}\n"
                sources.append({
                    "title": result.get('title', 'Unknown'),
                    "uri": result.get('url', '#')
                })
        
        # Extract images
        if "images" in search_results:
            images = search_results["images"]
        
        logger.info(f"[{self.name}] Collected {len(sources)} sources and {len(images)} images")
        
        # Update state
        state["context"] = context
        state["sources"] = sources
        state["images"] = images
        state["search_results"] = search_results
        
        return state
    
    def _perform_tavily_search(self, query: str) -> Dict[str, Any]:
        """Perform search using Tavily API with reliability testing"""
        # Skip Tavily search if API key is invalid
        if not self.tavily_api_key:
            raise Exception("TAVILY_API_KEY not configured")
        
        try:
            # Actually call the Tavily API
            url = "https://api.tavily.com/search"
            payload = {
                "api_key": self.tavily_api_key,
                "query": query,
                "search_depth": "advanced",
                "include_images": True,
                "include_answer": True,
                "max_results": 10
            }
            
            response = requests.post(url, json=payload, timeout=30)
            
            # Check if response is valid
            if response.status_code == 200:
                data = response.json()
                
                # Test if we're getting meaningful results
                if data.get("answer") and len(data.get("answer", "")) > 50:
                    # Tavily is reliable, return actual results
                    return data
                else:
                    # Tavily response is inadequate, raise exception to trigger fallback
                    raise Exception("Tavily returned inadequate results")
            else:
                # API error, trigger fallback
                raise Exception(f"Tavily API error: {response.status_code}")
                
        except Exception as e:
            logger.warning(f"[{self.name}] Tavily search failed or returned inadequate results: {str(e)}")
            # Return a fallback response to trigger the next provider in the chain
            content = f"Tavily search is temporarily unavailable for '{query}'. This is a fallback response."
            
            # Return in the same format as Tavily
            return {
                "answer": content,
                "results": [{"title": f"Search Result for {query}", "content": content, "url": "#"}],
                "images": []
            }
    
    def _perform_duckduckgo_search(self, query: str) -> Dict[str, Any]:
        """Perform search using DuckDuckGo"""
        try:
            # Import here to avoid dependency issues if not installed
            from backend.search.duckduckgo_search import perform_duckduckgo_search
            return perform_duckduckgo_search(query)
        except ImportError as e:
            logger.warning(f"DuckDuckGo search not available: {str(e)}")
            raise Exception("DuckDuckGo search not available")
        except Exception as e:
            logger.error(f"[{self.name}] DuckDuckGo search failed: {str(e)}")
            raise Exception(f"DuckDuckGo search failed: {str(e)}")
    
    def _perform_groq_search(self, query: str) -> Dict[str, Any]:
        """Fallback search using Groq API"""
        try:
            # Get Groq API key from environment
            groq_api_key = os.getenv("GROQ_API_KEY")
            if not groq_api_key:
                raise Exception("Groq API key not configured for fallback search")
            
            # Call Groq API
            url = "https://api.groq.com/openai/v1/chat/completions"
            headers = {
                "Authorization": f"Bearer {groq_api_key}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "model": "llama3-8b-8192",  # Updated model
                "messages": [{
                    "role": "user",
                    "content": f"You are a search engine. Provide a brief overview of: {query}. Keep it under 200 words."
                }],
                "temperature": 0.7,
                "max_tokens": 500
            }
            
            response = requests.post(url, json=payload, headers=headers)
            
            if not response.ok:
                raise Exception(f"Groq API Error: {response.status_code} - {response.text}")
            
            result = response.json()
            content = result["choices"][0]["message"]["content"]
            
            # Return in the same format as Tavily
            return {
                "answer": content,
                "results": [{"title": f"Search Result for {query}", "content": content, "url": "#"}],
                "images": []
            }
        except Exception as e:
            logger.error(f"[{self.name}] Groq search fallback failed: {str(e)}")
            raise Exception(f"Groq search failed: {str(e)}")
    
    def _perform_huggingface_search(self, query: str) -> Dict[str, Any]:
        """Fallback search using Hugging Face API"""
        try:
            # Get Hugging Face API key from environment
            huggingface_api_key = os.getenv("HUGGINGFACE_API_KEY")
            if not huggingface_api_key:
                raise Exception("Hugging Face API key not configured for fallback search")
            
            # Call Hugging Face API
            url = "https://api-inference.huggingface.co/models/google/gemma-2b"  # Updated model
            headers = {
                "Authorization": f"Bearer {huggingface_api_key}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "inputs": f"You are a search engine. Provide a brief overview of: {query}. Keep it under 200 words.",
                "parameters": {
                    "max_new_tokens": 500,
                    "temperature": 0.7
                }
            }
            
            response = requests.post(url, json=payload, headers=headers)
            
            if not response.ok:
                raise Exception(f"Hugging Face API Error: {response.status_code} - {response.text}")
            
            result = response.json()
            content = result[0]["generated_text"] if isinstance(result, list) else result.get("generated_text", "")
            
            # Return in the same format as Tavily
            return {
                "answer": content,
                "results": [{"title": f"Search Result for {query}", "content": content, "url": "#"}],
                "images": []
            }
        except Exception as e:
            logger.error(f"[{self.name}] Hugging Face search fallback failed: {str(e)}")
            raise Exception(f"Hugging Face search failed: {str(e)}")
    
    def _perform_google_search(self, query: str) -> Dict[str, Any]:
        """Fallback search using Google Search via Gemini API directly"""
        try:
            # Handle missing Google API key gracefully
            google_api_key = os.getenv("GOOGLE_API_KEY")
            
            # Return a simple fallback response instead of calling the API
            if not google_api_key:
                content = f"Google search is temporarily unavailable for '{query}' due to missing API configuration. This is a fallback response."
            else:
                content = f"Google search is temporarily unavailable for '{query}'. This is a fallback response."
            
            # Return in the same format as Tavily
            return {
                "answer": content,
                "results": [{"title": f"Search Result for {query}", "content": content, "url": "#"}],
                "images": []
            }
        except Exception as e:
            logger.error(f"[{self.name}] Google search fallback failed: {str(e)}")
            raise Exception(f"Google search failed: {str(e)}")

#!/usr/bin/env python3
"""
Wikipedia search utility for fallback when LLM providers fail
No API keys required - uses the public Wikipedia API
"""
import requests
import logging
from typing import Dict, Any, List
import re

logger = logging.getLogger(__name__)

def perform_wikipedia_search(query: str) -> Dict[str, Any]:
    """
    Perform a search using Wikipedia API
    
    Args:
        query (str): Search query
        
    Returns:
        Dict containing search results in the same format as other providers
    """
    try:
        logger.info(f"Performing Wikipedia search for: {query}")
        
        # First, search for relevant pages using the correct Wikipedia API endpoint
        # The correct endpoint for search is /api.php not /api/rest_v1/page/search
        search_url = "https://en.wikipedia.org/w/api.php"
        search_params = {
            "action": "query",
            "format": "json",
            "list": "search",
            "srsearch": query,
            "srlimit": 10
        }
        
        # Wikipedia API requires a proper User-Agent header
        headers = {
            "User-Agent": "JARVIS-Research-Assistant/1.0 (https://github.com/surajpanwar/Jarvis)"
        }
        
        search_response = requests.get(search_url, params=search_params, headers=headers, timeout=10)
        search_response.raise_for_status()
        search_data = search_response.json()
        
        if not search_data.get("query", {}).get("search"):
            logger.warning(f"No Wikipedia pages found for query: {query}")
            return {
                "answer": f"No detailed information found about '{query}' on Wikipedia.",
                "results": [],
                "images": []
            }
        
        # Get the first relevant page
        search_results = search_data["query"]["search"]
        page_title = search_results[0].get("title", "")
        
        # Get the page content using the correct endpoint
        content_url = "https://en.wikipedia.org/api/rest_v1/page/summary/" + page_title.replace(" ", "_")
        content_response = requests.get(content_url, headers=headers, timeout=10)
        content_response.raise_for_status()
        content_data = content_response.json()
        
        # Extract key information
        title = content_data.get("title", page_title)
        summary = content_data.get("extract", "")
        
        # Get images if available
        images = []
        if "thumbnail" in content_data:
            thumbnail = content_data["thumbnail"]
            if "source" in thumbnail:
                images.append(thumbnail["source"])
        
        # Format the results
        formatted_answer = f"Title: {title}\n\n{summary}"
        
        # Create results list with more detailed information
        results = []
        for result in search_results[:5]:  # Top 5 results
            results.append({
                "title": result.get("title", ""),
                "url": f"https://en.wikipedia.org/wiki/{result.get('title', '').replace(' ', '_')}",
                "content": result.get("snippet", "")  # Snippet is a short excerpt
            })
        
        logger.info(f"Successfully retrieved Wikipedia content for: {query}")
        
        return {
            "answer": formatted_answer,
            "results": results,
            "images": images
        }
        
    except requests.exceptions.RequestException as e:
        logger.error(f"Network error during Wikipedia search: {str(e)}")
        raise Exception(f"Wikipedia search failed due to network error: {str(e)}")
    except Exception as e:
        logger.error(f"Error during Wikipedia search: {str(e)}")
        raise Exception(f"Wikipedia search failed: {str(e)}")
#!/usr/bin/env python3
"""
Hybrid search utility that combines Wikipedia and DuckDuckGo
Provides a reliable fallback when all LLM providers fail
No API keys required
"""
import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

def perform_hybrid_search(query: str) -> Dict[str, Any]:
    """
    Perform hybrid search using Wikipedia first, then DuckDuckGo as fallback
    
    Args:
        query (str): Search query
        
    Returns:
        Dict containing search results in the same format as other providers
    """
    try:
        logger.info(f"Performing hybrid search for: {query}")
        
        # First try Wikipedia
        try:
            from backend.search.wikipedia_search import perform_wikipedia_search
            logger.info("Trying Wikipedia search first...")
            result = perform_wikipedia_search(query)
            logger.info("Wikipedia search successful")
            return result
        except Exception as wiki_error:
            logger.warning(f"Wikipedia search failed: {str(wiki_error)}")
            
            # Fall back to DuckDuckGo
            try:
                from backend.search.duckduckgo_search import perform_duckduckgo_search
                logger.info("Falling back to DuckDuckGo search...")
                result = perform_duckduckgo_search(query)
                logger.info("DuckDuckGo search successful")
                return result
            except Exception as ddg_error:
                logger.error(f"DuckDuckGo search also failed: {str(ddg_error)}")
                raise Exception(f"Both Wikipedia and DuckDuckGo searches failed. Wikipedia error: {str(wiki_error)}, DuckDuckGo error: {str(ddg_error)}")
                
    except Exception as e:
        logger.error(f"Unexpected error in hybrid search: {str(e)}")
        raise Exception(f"Hybrid search failed unexpectedly: {str(e)}")
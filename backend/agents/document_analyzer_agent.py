import requests
import os
from typing import Dict, Any
from .base_agent import BaseAgent
from ..utils import logger

class DocumentAnalyzerAgent(BaseAgent):
    """Agent responsible for analyzing documents using Google Gemini"""
    
    def __init__(self):
        super().__init__("Document Analyzer")
        self.google_api_key = os.getenv("GOOGLE_API_KEY")
    
    async def execute(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze document using Google Gemini"""
        file_base64 = state.get("file_base64", "")
        mime_type = state.get("mime_type", "text/plain")
        
        logger.info(f"[{self.name}] Analyzing document with MIME type: {mime_type}")
        
        if not self.google_api_key:
            raise Exception("GOOGLE_API_KEY not configured")
        
        if not file_base64:
            raise Exception("No document content provided")
        
        # Analyze document using Google Gemini
        analysis_result = self._analyze_document_with_gemini(file_base64, mime_type)
        
        logger.info(f"[{self.name}] Document analysis completed")
        
        # Update state
        state["report"] = analysis_result
        state["sources"] = [{"title": "Uploaded Document", "uri": "#local-file"}]
        state["images"] = []
        
        return state
    
    def _analyze_document_with_gemini(self, file_base64: str, mime_type: str) -> str:
        """Analyze document using Google Gemini API with comprehensive fallback support"""
        try:
            # First try: Direct Gemini API call with updated model
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key={self.google_api_key}"            
            payload = {
                "contents": [{
                    "parts": [
                        {"inlineData": {"mimeType": mime_type, "data": file_base64}},
                        {"text": "Analyze this document and provide a comprehensive, meaningful summary of its contents. Focus on the key points, main ideas, and important details. Structure your response with clear sections: Executive Summary, Key Topics Covered, Main Arguments or Points, Significant Details, and Conclusion. Avoid technical jargon and provide an accessible explanation of what the document contains."}
                    ]
                }],
                "generationConfig": {
                    "temperature": 0.7,
                    "maxOutputTokens": 4096
                }
            }
            
            response = requests.post(url, json=payload)
            response.raise_for_status()
            result = response.json()
            return result["candidates"][0]["content"]["parts"][0]["text"]
            
        except Exception as primary_error:
            logger.error(f"[{self.name}] Primary Gemini document analysis failed: {str(primary_error)}")
            
            # Check if it's a rate limit error
            error_str = str(primary_error).lower()
            is_rate_limit = "429" in error_str or "too many requests" in error_str or "quota" in error_str
            
            if is_rate_limit:
                # Try fallback with reduced tokens
                logger.info(f"[{self.name}] Rate limit detected, trying fallback with reduced tokens")
                try:
                    payload["generationConfig"]["maxOutputTokens"] = 2048
                    response = requests.post(url, json=payload)
                    response.raise_for_status()
                    result = response.json()
                    return result["candidates"][0]["content"]["parts"][0]["text"]
                except Exception as fallback_e:
                    logger.error(f"[{self.name}] Reduced token fallback also failed: {str(fallback_e)}")
                    
            # If primary method failed or rate limit fallback failed, re-raise the original error
            # This will trigger the Groq fallback in the chief agent
            logger.info(f"[{self.name}] Primary method failed, triggering Groq fallback")
            raise Exception(f"Document analysis failed. Primary method failed due to: {str(primary_error)}")
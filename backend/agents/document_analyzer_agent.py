import requests
import os
from typing import Dict, Any
from .base_agent import BaseAgent
from ..utils import logger
from ..llm_utils import generate_llm_content

class DocumentAnalyzerAgent(BaseAgent):
    """Agent responsible for analyzing documents using multiple LLM providers with fallback support"""
    
    def __init__(self):
        super().__init__("Document Analyzer")
        self.google_api_key = os.getenv("GOOGLE_API_KEY")
    
    async def execute(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze document using LLM providers with fallback support"""
        file_base64 = state.get("file_base64", "")
        mime_type = state.get("mime_type", "text/plain")
        
        logger.info(f"[{self.name}] Analyzing document with MIME type: {mime_type}")
        
        if not file_base64:
            raise Exception("No document content provided")
        
        # Analyze document using improved LLM utility with fallback support
        try:
            analysis_result = self._analyze_document_with_llm(file_base64, mime_type)
            
            # Check if we got a fallback response and treat it as a valid response
            # but log that we're using fallback content
            if analysis_result.get("provider") == "Fallback":
                logger.warning(f"[{self.name}] Using fallback response due to LLM failures")
            
            logger.info(f"[{self.name}] Document analysis completed using {analysis_result.get('provider', 'Unknown')}")
            
            # Update state
            state["report"] = analysis_result.get("content", "")
            state["sources"] = [{"title": "Uploaded Document", "uri": "#local-file"}]
            state["images"] = []
            
            return state
        except Exception as e:
            logger.error(f"[{self.name}] Document analysis failed: {str(e)}")
            # Re-raise to trigger the next fallback in the chain
            raise Exception(f"Document analysis failed: {str(e)}")
    
    def _analyze_document_with_llm(self, file_base64: str, mime_type: str) -> Dict[str, Any]:
        """Analyze document using LLM providers with comprehensive fallback support"""
        try:
            # Use our enhanced LLM utility that handles multiple providers with fallback
            prompt = f"""Analyze this document (MIME type: {mime_type}) and provide a comprehensive, meaningful summary of its contents. 
            Focus on the key points, main ideas, and important details.
            Structure your response with these sections:
            1. EXECUTIVE SUMMARY: A clear overview of what the document is about
            2. KEY TOPICS COVERED: The main subjects discussed
            3. MAIN ARGUMENTS/POINTS: Core ideas or positions presented
            4. SIGNIFICANT DETAILS: Important facts, figures, or examples
            5. CONCLUSION: Overall takeaway from the document
            
            Provide a detailed, accessible explanation without technical jargon."""
            
            system_instruction = "You are a professional document analyst. Provide a thorough, insightful analysis of the document content."
            
            # Try to generate content using our improved LLM utility with fallback
            result = generate_llm_content(
                prompt=prompt,
                system_instruction=system_instruction,
                is_report=True
            )
            
            return result
            
        except Exception as e:
            logger.error(f"[{self.name}] LLM document analysis failed: {str(e)}")
            # Re-raise to trigger the next fallback in the chain
            raise Exception(f"LLM document analysis failed: {str(e)}")
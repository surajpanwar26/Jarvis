import requests
import os
from typing import Dict, Any
from backend.agents.base_agent import BaseAgent
from backend.utils import logger
from requests.exceptions import Timeout
from backend.llm_utils import generate_llm_content

# Import our hybrid search
from backend.search.hybrid_search import perform_hybrid_search


class ReportAgent(BaseAgent):
    """Agent responsible for generating reports using LLM with fallback support"""
    
    def __init__(self):
        super().__init__("Report")
    
    async def execute(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """Generate report using LLM with fallback support"""
        topic = state.get("topic", "")
        is_deep = state.get("is_deep", False)
        context = state.get("context", "")
        
        logger.info(f"[{self.name}] Generating {'deep' if is_deep else 'quick'} report on: {topic}")
        
        try:
            # Generate report using backend LLM endpoint (which has fallback chain)
            report_result = self._generate_report_with_llm(topic, context, is_deep)
            
            # Check if this is a fallback response - if so, try hybrid search instead
            provider_used = report_result.get("provider", "Unknown")
            if provider_used == "Fallback":
                logger.warning(f"[{self.name}] LLM generation returned fallback response, trying hybrid search approach")
                self.emit_event("agent_action", "LLM generation returned fallback response, trying alternative search-based approach...")
                raise Exception("LLM returned fallback response")
            else:
                logger.info(f"[{self.name}] Report successfully generated using {provider_used}")
                self.emit_event("agent_action", f"Report drafted using {provider_used}")
        except Exception as e:
            logger.warning(f"[{self.name}] LLM generation failed, trying hybrid search approach: {str(e)}")
            self.emit_event("agent_action", "LLM generation failed, trying alternative search-based approach...")
            
            # Use hybrid search as fallback before emergency content
            try:
                search_result = perform_hybrid_search(topic)
                report_result = self._generate_report_from_search(topic, search_result, is_deep)
                provider_used = "Hybrid Search"
                self.emit_event("agent_action", "Report generated using hybrid search approach")
            except Exception as search_error:
                logger.error(f"[{self.name}] Hybrid search also failed: {str(search_error)}")
                # Re-raise the original LLM error to trigger emergency content
                raise e
        
        logger.info(f"[{self.name}] Report generation completed")
        
        # Update state
        state["report"] = report_result.get("content", "")
        
        return state
    
    def _generate_report_with_llm(self, topic: str, context: str, is_deep: bool) -> Dict[str, Any]:
        """Generate report using backend LLM endpoint with fallback support"""
        if is_deep:
            prompt = f"""You are a professional research analyst and report writer tasked with creating a comprehensive, well-structured report on "{topic}".
            
Use the following context information to create a detailed report with the following structure:

# Executive Summary
Provide a comprehensive executive summary with 5-6 detailed paragraphs that thoroughly capture the essence of the topic, key insights, main conclusions, and critical dimensions. Each paragraph should focus on a different aspect or perspective of the topic to ensure comprehensive coverage.

# Introduction
Provide background information and context about the topic, explaining its significance and relevance.

# Detailed Analysis
Create 4-5 main sections with detailed analysis. Each section should have:
- Clear heading
- Comprehensive explanation with supporting details
- Relevant data, statistics, or examples where available
- Critical evaluation of different perspectives

# Key Findings
Present 8-10 key findings as bullet points with brief explanations.

# Implications and Applications
Discuss the practical implications, potential applications, and real-world impact of the findings.

# Challenges and Limitations
Identify major challenges, limitations, or areas of concern related to the topic.

# Future Outlook
Discuss emerging trends, potential developments, and future directions related to the topic.

# Conclusions and Recommendations
Summarize the main conclusions and provide 5-7 actionable recommendations.

Context Information:
{context}

Ensure the report is well-organized and professionally formatted using proper Markdown syntax with appropriate headings and lists. Create a comprehensive report that provides substantial insights while remaining focused. Aim for approximately 2500+ words total with particular emphasis on a detailed executive summary."""
        else:
            prompt = f"""You are a research analyst tasked with creating a concise but comprehensive report on "{topic}".

Use the following context information to create a well-structured report with the following structure:

# Executive Summary
Provide a comprehensive executive summary with 3-5 detailed paragraphs covering different aspects of the topic.

# Analysis and Insights
Provide critical analysis with supporting evidence, examples, and relevant data where available.

# Key Findings
Present 5-7 key findings as bullet points with brief explanations.

# Implications
Discuss the significance and potential implications of the findings.

# Conclusions and Recommendations
Summarize the main conclusions and provide 3-4 actionable recommendations.

Context Information:
{context}

Ensure the report is well-organized and professionally formatted using proper Markdown syntax with appropriate headings and lists. Create a comprehensive report that provides substantial insights while remaining focused. Aim for approximately 1500-2000 words total with particular emphasis on a detailed executive summary."""
        
        try:
            result = generate_llm_content(
                prompt=prompt,
                system_instruction="You are a research analyst skilled at creating well-structured, concise reports optimized for display in a UI. Focus only on information that will be shown to the user. If you encounter any issues with API providers, gracefully handle fallback scenarios.",
                is_report=True
            )
            return result
        except Timeout:
            logger.error(f"[{self.name}] LLM generation timed out")
            raise Exception("Report generation timed out. Please try again later.")
        except Exception as e:
            logger.error(f"[{self.name}] LLM generation failed: {str(e)}")
            raise Exception(f"Report generation failed: {str(e)}")
    
    def _generate_report_from_search(self, topic: str, search_result: Dict[str, Any], is_deep: bool) -> Dict[str, Any]:
        """Generate a report from search results when LLM fails"""
        try:
            # Extract information from search results
            answer = search_result.get("answer", "")
            results = search_result.get("results", [])
            images = search_result.get("images", [])
            
            # Create a structured report from the search results
            if is_deep:
                report_content = f"""# Report on {topic}

## Executive Summary
{answer[:1000]}...

## Detailed Information
"""
                # Add more detailed sections for deep research
                for i, result in enumerate(results[:3]):
                    report_content += f"""
### Section {i+1}: {result.get('title', 'Information')}
{result.get('content', 'No content available')}...

"""
                
                report_content += f"""
## Key Facts
- Topic: {topic}
- Information sourced from reliable online sources
- Report generated using search-based approach due to LLM unavailability

## Additional Resources
For more information, visit:
"""
                for result in results[:5]:
                    report_content += f"- [{result.get('title', 'Resource')}]({result.get('url', '#')})\n"
                    
            else:
                # Quick research format
                report_content = f"""# Quick Report on {topic}

## Summary
{answer}

## Key Points
"""
                # Add bullet points from results
                for result in results[:3]:
                    content = result.get('content', 'No content')
                    # Extract first few sentences as key points
                    sentences = content.split('.')[:3]
                    for sentence in sentences:
                        if sentence.strip():
                            report_content += f"- {sentence.strip()}.\n"
                
                report_content += f"""
## Sources
"""
                for result in results[:3]:
                    report_content += f"- [{result.get('title', 'Source')}]({result.get('url', '#')})\n"
            
            return {
                "content": report_content,
                "provider": "Hybrid Search",
                "images": images
            }
            
        except Exception as e:
            logger.error(f"[{self.name}] Failed to generate report from search results: {str(e)}")
            raise Exception(f"Failed to generate report from search results: {str(e)}")
    
    def emit_event(self, event_type: str, message: str):
        """Helper method to emit events"""
        # This would typically send events to the frontend
        logger.info(f"[{self.name}] {event_type}: {message}")
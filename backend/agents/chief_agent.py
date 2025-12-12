from typing import Dict, Any
from backend.agents.base_agent import BaseAgent
from backend.agents.researcher_agent import ResearcherAgent
from backend.agents.image_agent import ImageAgent
from backend.agents.source_agent import SourceAgent
from backend.agents.report_agent import ReportAgent
from backend.agents.ai_assistant_agent import AIAssistantAgent
from backend.agents.document_analyzer_agent import DocumentAnalyzerAgent
from backend.agents.local_document_analyzer import LocalDocumentAnalyzerAgent
from backend.utils import logger

class ChiefAgent(BaseAgent):
    """Chief agent that orchestrates all other agents"""
    
    def __init__(self):
        super().__init__("Chief")
        self.researcher = ResearcherAgent()
        self.image_agent = ImageAgent()
        self.source_agent = SourceAgent()
        self.report_agent = ReportAgent()
        self.ai_assistant = AIAssistantAgent()
        self.document_analyzer = DocumentAnalyzerAgent()
        self.local_document_analyzer = LocalDocumentAnalyzerAgent()
    
    async def execute(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """Orchestrate the research workflow"""
        logger.info(f"[{self.name}] Starting research workflow")
        
        try:
            # Check if this is an AI Chatbot request
            if state.get("question"):
                # For AI Chatbot, we only need the AI Assistant agent
                logger.info(f"[{self.name}] Processing AI Chatbot request")
                state = await self.ai_assistant.execute(state)
            # Check if this is a document analysis request
            elif state.get("file_base64"):
                # For document analysis, try API-based first, then Groq, then local
                logger.info(f"[{self.name}] Processing document analysis request")
                try:
                    # First try: Enhanced LLM-based document analyzer with fallback support
                    state = await self.document_analyzer.execute(state)
                    # If we get here, the analysis was successful (even if it used fallback)
                    logger.info(f"[{self.name}] Document analysis completed successfully")
                except Exception as llm_error:
                    logger.warning(f"[{self.name}] LLM document analysis failed: {str(llm_error)}")
                    try:
                        # Second try: Local document analyzer as final fallback
                        logger.info(f"[{self.name}] Falling back to local document analysis")
                        state = await self.local_document_analyzer.execute(state)
                    except Exception as local_error:
                        logger.error(f"[{self.name}] All document analysis methods failed. LLM error: {str(llm_error)}, Local error: {str(local_error)}")
                        # If all methods fail, provide a meaningful error message
                        state["report"] = f"""# Document Analysis Failed

## Error Details
Unable to analyze the document due to technical issues:

- LLM-based analysis error: {str(llm_error)}
- Local analysis error: {str(local_error)}

## Possible Solutions
1. Check your internet connection
2. Verify API keys are properly configured
3. Try uploading a different document format
4. Retry the analysis in a few minutes

## Alternative Approach
As a workaround, you can:
1. Convert the document to plain text
2. Use the Quick Research feature with key terms from your document
3. Copy and paste document content directly into a research query

We apologize for the inconvenience."""
                        state["sources"] = [{"title": "Analysis Error", "uri": "#error"}]
                        state["images"] = []
            else:
                # For research requests, execute the full workflow
                logger.info(f"[{self.name}] Processing research request")
                
                # 1. Researcher Agent - Gather information
                state = await self.researcher.execute(state)
                
                # 2. Image Agent - Extract visual assets
                state = await self.image_agent.execute(state)
                
                # 3. Source Agent - Process sources
                state = await self.source_agent.execute(state)
                
                # 4. Report Agent - Generate report
                state = await self.report_agent.execute(state)
            
            logger.info(f"[{self.name}] Workflow completed successfully")
            return state
            
        except Exception as e:
            logger.error(f"[{self.name}] Workflow failed: {str(e)}")
            raise e
import base64
import io
import re
from typing import Dict, Any
from .base_agent import BaseAgent
from ..utils import logger

class LocalDocumentAnalyzerAgent(BaseAgent):
    """Agent responsible for analyzing documents locally without external APIs"""
    
    def __init__(self):
        super().__init__("Local Document Analyzer")
    
    async def execute(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze document locally using open-source libraries"""
        file_base64 = state.get("file_base64", "")
        mime_type = state.get("mime_type", "text/plain")
        
        logger.info(f"[{self.name}] Analyzing document locally with MIME type: {mime_type}")
        
        if not file_base64:
            raise Exception("No document content provided")
        
        try:
            # Analyze document locally
            analysis_result = self._analyze_document_locally(file_base64, mime_type)
            
            logger.info(f"[{self.name}] Local document analysis completed")
            
            # Update state
            state["report"] = analysis_result
            state["sources"] = [{"title": "Uploaded Document", "uri": "#local-file"}]
            state["images"] = []
            
            return state
        except Exception as e:
            logger.error(f"[{self.name}] Local document analysis failed: {str(e)}")
            # Provide a minimal fallback report even if local analysis fails
            state["report"] = f"""# Document Analysis Report

## Analysis Method
This document was processed using local analysis techniques without external APIs.

## Status
Local analysis encountered an error: {str(e)}

## Suggestions
1. Try uploading a different document format
2. Ensure the document is not corrupted
3. For PDF files, try converting to text format first
4. For very large documents, try breaking into smaller sections

We're committed to providing analysis capabilities even when external services are unavailable."""
            state["sources"] = [{"title": "Local Analysis", "uri": "#local-file"}]
            state["images"] = []
            # Return the state with the fallback report instead of re-raising the exception
            return state
    
    def _analyze_document_locally(self, file_base64: str, mime_type: str) -> str:
        """Analyze document locally using open-source libraries"""
        try:
            # Validate input
            if not file_base64:
                raise ValueError("No document content provided")
            
            # Decode base64 content
            file_bytes = base64.b64decode(file_base64)
            
            # Extract text based on file type
            text_content = self._extract_text(file_bytes, mime_type)
            
            # Validate extracted text
            if not text_content or len(text_content.strip()) == 0:
                text_content = "No readable content found in the document. This might be an image-based PDF or a document with unsupported formatting."
            
            # Perform local analysis
            analysis_report = self._generate_local_analysis(text_content)
            
            return analysis_report
            
        except Exception as e:
            logger.error(f"[{self.name}] Local document analysis failed: {str(e)}")
            # Re-raise to be handled by the caller
            raise Exception(f"Local document analysis failed: {str(e)}")
    
    def _extract_text(self, file_bytes: bytes, mime_type: str) -> str:
        """Extract text from document based on MIME type"""
        try:
            if mime_type == "application/pdf":
                # PDF extraction using pdfplumber
                try:
                    import pdfplumber
                    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
                        text = ""
                        for page in pdf.pages:
                            page_text = page.extract_text()
                            if page_text:
                                text += page_text + "\n"
                        return text
                except ImportError:
                    logger.warning(f"[{self.name}] pdfplumber not available, trying PyPDF2")
                    # Fallback to PyPDF2 if pdfplumber is not available
                    try:
                        import PyPDF2
                        pdf_reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
                        text = ""
                        for page in pdf_reader.pages:
                            page_text = page.extract_text()
                            if page_text:
                                text += page_text + "\n"
                        return text
                    except ImportError:
                        logger.warning(f"[{self.name}] PyPDF2 not available, falling back to text decoding")
                        # Final fallback - decode as text
                        return file_bytes.decode('utf-8', errors='ignore')
                except Exception as e:
                    logger.warning(f"[{self.name}] PDF extraction failed with pdfplumber: {str(e)}, trying PyPDF2")
                    # Try PyPDF2 as fallback
                    try:
                        import PyPDF2
                        pdf_reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
                        text = ""
                        for page in pdf_reader.pages:
                            page_text = page.extract_text()
                            if page_text:
                                text += page_text + "\n"
                        return text
                    except Exception as e2:
                        logger.warning(f"[{self.name}] PDF extraction failed with PyPDF2: {str(e2)}, falling back to text decoding")
                        # Final fallback - decode as text
                        return file_bytes.decode('utf-8', errors='ignore')
            
            elif mime_type in ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", 
                              "application/msword"]:
                # Word document extraction
                try:
                    from docx import Document
                    doc = Document(io.BytesIO(file_bytes))
                    text = ""
                    for paragraph in doc.paragraphs:
                        text += paragraph.text + "\n"
                    return text
                except ImportError:
                    logger.warning(f"[{self.name}] python-docx not available, falling back to text decoding")
                    # Fallback - decode as text
                    return file_bytes.decode('utf-8', errors='ignore')
                except Exception as e:
                    logger.warning(f"[{self.name}] Word document extraction failed: {str(e)}, falling back to text decoding")
                    # Fallback - decode as text
                    return file_bytes.decode('utf-8', errors='ignore')
            
            elif mime_type.startswith("text/"):
                # Plain text files
                return file_bytes.decode('utf-8', errors='ignore')
            
            else:
                # For other file types, try to decode as text
                logger.info(f"[{self.name}] Unknown MIME type {mime_type}, attempting text decoding")
                return file_bytes.decode('utf-8', errors='ignore')
                
        except Exception as e:
            logger.warning(f"[{self.name}] Text extraction failed, using raw content: {str(e)}")
            return file_bytes.decode('utf-8', errors='ignore')
    
    def _generate_local_analysis(self, text_content: str) -> str:
        """Generate analysis report using local text processing"""
        # Clean and preprocess text
        cleaned_text = self._clean_text(text_content)
        
        # Get basic statistics
        word_count = len(cleaned_text.split())
        char_count = len(cleaned_text)
        sentence_count = len(re.split(r'[.!?]+', cleaned_text))
        
        # Extract key information
        key_points = self._extract_key_points(cleaned_text)
        entities = self._extract_entities(cleaned_text)
        topics = self._get_topics(cleaned_text)
        sentiment = self._analyze_sentiment(cleaned_text)
        
        # Generate meaningful summary
        summary = self._generate_meaningful_summary(cleaned_text, key_points, topics)
        
        # Generate report
        report = f"""# Document Analysis Report

## Executive Summary

{summary}

## Key Topics Covered

{chr(10).join([f"- {topic}" for topic in topics[:8]]) if topics else "No specific topics identified"}

## Main Points and Arguments

{chr(10).join([f"- {point}" for point in key_points[:12]]) if key_points else "No key points identified"}

## Document Statistics

- **Word Count**: {word_count:,}
- **Character Count**: {char_count:,}
- **Sentence Count**: {sentence_count}
- **Estimated Reading Time**: Approximately {max(1, word_count // 200)} minutes

## Entities Detected

{chr(10).join([f"- {entity}" for entity in entities[:10]]) if entities else "No specific entities detected"}

## Sentiment Analysis

{sentiment}

## Analysis Methodology

This analysis was conducted entirely locally using open-source text processing techniques. No external APIs or cloud services were utilized, ensuring complete data privacy and offline capability.

## Conclusion

The document has been successfully analyzed using local processing techniques. This approach provides a reliable fallback option when external APIs are unavailable or when maximum privacy is required."""

        return report
    
    def _clean_text(self, text: str) -> str:
        """Clean and normalize text"""
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text)
        # Remove special characters but keep punctuation
        text = re.sub(r'[^\w\s.,!?;:-]', ' ', text)
        return text.strip()
    
    def _extract_key_points(self, text: str) -> list:
        """Extract key points from text"""
        # Simple approach: extract sentences that seem important
        sentences = re.split(r'[.!?]+', text)
        key_points = []
        
        # Look for sentences with certain characteristics
        for sentence in sentences:
            sentence = sentence.strip()
            if len(sentence) > 20 and len(sentence) < 300:  # Reasonable length
                # Look for sentences with numbers, capitalized words, or key terms
                if (re.search(r'\d+', sentence) or 
                    len(re.findall(r'\b[A-Z]{2,}\b', sentence)) > 1 or
                    any(term in sentence.lower() for term in ['important', 'significant', 'critical', 'key', 'main', 'primary'])):
                    key_points.append(sentence)
        
        # If we didn't find enough key points, just take the first few sentences
        if len(key_points) < 3:
            key_points = [s.strip() for s in sentences[:5] if len(s.strip()) > 20]
        
        return key_points if key_points else ["Document content analysis completed."]
    
    def _extract_entities(self, text: str) -> list:
        """Extract named entities from text"""
        # Simple entity extraction without spaCy
        entities = []
        
        # Extract potential names (capitalized words)
        names = re.findall(r'\b[A-Z][a-z]+(?:\s[A-Z][a-z]+)*\b', text)
        # Filter out common words
        common_words = {'The', 'This', 'That', 'These', 'Those', 'With', 'From', 'They', 'Will', 'Would', 'There', 'What', 'When', 'Where', 'Which', 'While', 'These', 'Those', 'Than', 'Been', 'Were', 'Could', 'Should', 'Might', 'Must', 'About', 'After', 'Before', 'Under'}
        entities.extend([name for name in names if name not in common_words and len(name) > 2])
        
        # Extract potential numbers/dates
        numbers = re.findall(r'\b\d+(?:\.\d+)?\b', text)
        entities.extend([f"Number: {num}" for num in numbers[:5]])
        
        # Extract potential emails
        emails = re.findall(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', text)
        entities.extend([f"Email: {email}" for email in emails])
        
        return list(set(entities))  # Remove duplicates
    
    def _get_topics(self, text: str) -> list:
        """Extract key topics from the document"""
        # Simple word frequency analysis
        words = re.findall(r'\b[a-zA-Z]{4,}\b', text.lower())
        word_freq = {}
        for word in words:
            word_freq[word] = word_freq.get(word, 0) + 1
        
        # Sort by frequency and filter for meaningful topics
        sorted_words = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)
        topics = []
        
        # Common stop words to exclude
        stop_words = {'that', 'have', 'with', 'this', 'from', 'they', 'will', 'would', 'there', 'what', 'when', 'where', 'which', 'while', 'these', 'those', 'than', 'been', 'were', 'could', 'should', 'might', 'must', 'about', 'into', 'over', 'after', 'before', 'under', 'above', 'below', 'between', 'among', 'through', 'during', 'without', 'within', 'along', 'across', 'behind', 'beyond', 'toward', 'around', 'amongst', 'throughout'}
        
        for word, freq in sorted_words[:20]:
            if word not in stop_words and freq > 1:
                topics.append(f"{word.title()} (mentioned {freq} times)")
        
        return topics[:10]  # Return top 10 topics
    
    def _analyze_sentiment(self, text: str) -> str:
        """Perform basic sentiment analysis"""
        # Simple sentiment keywords
        positive_words = {'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'brilliant', 'outstanding', 'superb', 'remarkable', 'positive', 'successful', 'beneficial', 'advantageous', 'favorable', 'promising', 'encouraging', 'impressive', 'valuable', 'effective'}
        negative_words = {'bad', 'terrible', 'awful', 'horrible', 'dreadful', 'abysmal', 'poor', 'negative', 'disappointing', 'frustrating', 'problematic', 'difficult', 'challenging', 'concerning', 'worrying', 'troubling', 'unfortunate', 'unfavorable', 'discouraging', 'ineffective'}
        
        words = set(text.lower().split())
        positive_count = sum(1 for word in words if word in positive_words)
        negative_count = sum(1 for word in words if word in negative_words)
        
        if positive_count > negative_count:
            return "Overall sentiment appears positive, with encouraging language and optimistic tone."
        elif negative_count > positive_count:
            return "Overall sentiment appears negative, with concerning language and critical tone."
        else:
            return "Overall sentiment appears neutral, with balanced language and objective tone."
    
    def _generate_meaningful_summary(self, text: str, key_points: list, topics: list) -> str:
        """Generate a meaningful summary of the document content"""
        if not text.strip():
            return "No readable content was found in the document. This might be an image-based PDF or a document with unsupported formatting."
        
        # Get first few sentences as opening context
        sentences = re.split(r'[.!?]+', text)[:5]
        opening = '. '.join(sentences).strip()
        
        # Get topics overview
        topics_text = ", ".join([topic.split(' (')[0] for topic in topics[:5]]) if topics else "various subjects"
        
        # Get key points summary
        points_summary = "\n".join([f"  • {point[:100]}{'...' if len(point) > 100 else ''}" for point in key_points[:3]]) if key_points else ""
        
        summary = f"This document discusses {topics_text} and contains approximately {len(text.split())} words. "
        
        if opening:
            summary += f"The content begins with: {opening[:200]}{'...' if len(opening) > 200 else '.'} "
        
        if points_summary:
            summary += f"\n\nKey points covered include:\n{points_summary}"
        
        return summary
    
    def _get_topic_overview(self, text: str) -> str:
        """Get an overview of topics in the document"""
        # Simple word frequency analysis
        words = re.findall(r'\b[a-zA-Z]{4,}\b', text.lower())
        word_freq = {}
        for word in words:
            word_freq[word] = word_freq.get(word, 0) + 1
        
        # Sort by frequency
        sorted_words = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)
        top_words = [word for word, freq in sorted_words[:10]]
        
        if top_words:
            return f"The document frequently mentions terms such as: {', '.join(top_words[:5])}"
        else:
            return "The document covers general topics with no specific high-frequency terms identified."

# Factory function to choose between local and API-based analysis
def get_document_analyzer(use_local: bool = False):
    """Factory function to get the appropriate document analyzer"""
    if use_local:
        return LocalDocumentAnalyzerAgent()
    else:
        # Import and return the API-based analyzer
        try:
            from .document_analyzer_agent import DocumentAnalyzerAgent
            return DocumentAnalyzerAgent()
        except ImportError:
            # Fallback to local if API version is not available
            return LocalDocumentAnalyzerAgent()
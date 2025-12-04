import { ResearchResult, ChatMessage } from "../types";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8002/api";

/**
 * Analyze a document using the backend service
 */
export const analyzeDocument = async (fileBase64: string, mimeType: string): Promise<ResearchResult> => {
  try {
    // Use backend API for document analysis
    const response = await fetch(`${API_URL}/document-analysis`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ file_base64: fileBase64, mime_type: mimeType })
    });

    if (!response.ok) {
      throw new Error(`Document analysis failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Document analysis error:", error);
    throw error;
  }
};

/**
 * Ask a question using the AI Chatbot
 */
export const askQuestion = async (question: string, context: string): Promise<string> => {
  try {
    // Use backend API for AI Chatbot
    const response = await fetch(`${API_URL}/question`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, context })
    });

    if (!response.ok) {
      throw new Error(`Question failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result.answer;
  } catch (error) {
    console.error("Question error:", error);
    throw error;
  }
};

/**
 * Chat / AI Chatbot Service
 */
export const askFollowUp = async (
  history: ChatMessage[], 
  context: string, 
  question: string
): Promise<string> => {
  try {
    // Use backend API for AI Chatbot
    const response = await fetch("http://localhost:8002/api/question", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        question: question,
        context: context,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "AI Chatbot failed");
    }

    const result = await response.json();
    return result.answer;
  } catch (error) {
    console.error("Chat failed:", error);
    throw error;
  }
};
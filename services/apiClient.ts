import { ResearchResult, ChatMessage } from "../types";

const API_URL = "http://localhost:8000/api";

export const api = {
  health: async () => {
    try {
      const res = await fetch(`${API_URL}/`); // Root endpoint checks server status
      return res.ok;
    } catch {
      return false;
    }
  },

  startResearch: async (topic: string, isDeep: boolean): Promise<ResearchResult> => {
    try {
      // Matches ResearchRequest Pydantic model
      const response = await fetch(`${API_URL}/research`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, is_deep: isDeep }) 
      });
      
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || "Backend research failed");
      }
      return await response.json();
    } catch (error: any) {
      console.error("API Error:", error);
      throw error;
    }
  },

  chat: async (history: ChatMessage[], context: string, question: string) => {
    try {
      // Matches ChatRequest Pydantic model
      const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          history: history.map(h => ({ role: h.role, content: h.content })), 
          context, 
          question 
        })
      });
      
      if (!response.ok) {
         const err = await response.json();
         throw new Error(err.detail || "Chat failed");
      }
      const data = await response.json();
      return data.answer;
    } catch (error) {
      console.error("Chat API Error:", error);
      throw error;
    }
  }
};

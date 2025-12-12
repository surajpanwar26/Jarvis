import { GoogleGenAI } from "@google/genai";
import { config, hasKey, logConfigStatus, getApiUrl, getEnv } from "./config";

// Initialize logging once
logConfigStatus();

// --- Types ---
interface GenerationParams {
  prompt: string;
  systemInstruction?: string;
  jsonMode?: boolean;
  thinkingBudget?: number;
}

interface LLMProvider {
  generate(params: GenerationParams): Promise<string>;
  generateStream(params: GenerationParams): AsyncGenerator<string, void, unknown>;
}

// --- 1. Hugging Face Implementation (Fallback) ---
class HuggingFaceProvider implements LLMProvider {
  private apiKey: string;
  // Use the backend endpoint for Hugging Face
  private baseUrl = "/api/llm/generate";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generate(params: GenerationParams): Promise<string> {
    // Optimize token usage based on request type
    const isReportGeneration = params.prompt.toLowerCase().includes("report") || 
                              (params.systemInstruction && params.systemInstruction.toLowerCase().includes("report"));
    
    try {
      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          prompt: params.prompt,
          systemInstruction: params.systemInstruction,
          maxTokens: isReportGeneration ? 2048 : 1024,
          jsonMode: params.jsonMode
        })
      });

      if (!response.ok) {
        throw new Error(`HuggingFace API Error: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.result || data.content || "";
    } catch (error) {
      console.error("HuggingFace Generation Failed:", error);
      throw error;
    }
  }

  async *generateStream(params: GenerationParams): AsyncGenerator<string, void, unknown> {
    const fullText = await this.generate(params);
    const chunkSize = 50;
    for (let i = 0; i < fullText.length; i += chunkSize) {
      yield fullText.slice(i, i + chunkSize);
      await new Promise(r => setTimeout(r, 10)); 
    }
  }
}

// --- 2. Groq Implementation (Optional High Speed) ---
class GroqProvider implements LLMProvider {
  private apiKey: string;
  // Use the backend endpoint for Groq instead of direct API calls
  private baseUrl = "/api/llm/generate";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generate(params: GenerationParams): Promise<string> {
    try {
      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          prompt: params.prompt,
          systemInstruction: params.systemInstruction,
          provider: "groq",
          jsonMode: params.jsonMode
        })
      });

      if (!response.ok) {
        throw new Error(`Groq API Error: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.result || data.content || "";
    } catch (error) {
      console.error("Groq Generation Failed:", error);
      throw error;
    }
  }

  async *generateStream(params: GenerationParams): AsyncGenerator<string, void, unknown> {
    const fullText = await this.generate(params);
    const chunkSize = 50;
    for (let i = 0; i < fullText.length; i += chunkSize) {
      yield fullText.slice(i, i + chunkSize);
      await new Promise(r => setTimeout(r, 10)); 
    }
  }
}

// --- 3. Google Gemini Implementation (PRIMARY) ---
class GeminiProvider implements LLMProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generate(params: GenerationParams): Promise<string> {
    try {
      // Instead of making direct calls to Google API, use our backend endpoint
      const response = await fetch("/api/llm/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          prompt: params.prompt,
          systemInstruction: params.systemInstruction,
          provider: "gemini",
          jsonMode: params.jsonMode,
          thinkingBudget: params.thinkingBudget
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        // Check if this is a quota limit error
        if (response.status === 429 || errorText.toLowerCase().includes('quota') || errorText.toLowerCase().includes('limit')) {
          throw new Error(`API Limit Reached: ${errorText}`);
        }
        throw new Error(`Backend LLM API Error: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      return data.content || "";
    } catch (e: any) {
      console.error("Gemini Generation Failed:", e.message);
      // Check if this is a quota limit error
      if (e.message.includes('API Limit Reached') || e.message.includes('quota') || e.message.includes('limit')) {
        throw new Error(`Google API Limit Reached. Please wait for quota reset or use alternative providers.`);
      }
      throw new Error(`Gemini Generation Failed: ${e.message}`);
    }
  }

  async *generateStream(params: GenerationParams): AsyncGenerator<string, void, unknown> {
    // For streaming, we'll just return the full content since our backend doesn't support streaming yet
    const text = await this.generate(params);
    yield text;
  }
}

// --- Main Factory: Prioritizes Gemini for Single-Key Operation ---
export const getLLMProvider = (): LLMProvider => {
  // 1. Google Gemini (Primary for everything)
  if (hasKey(config.googleApiKey)) {
    console.log("Using Provider: Google Gemini");
    return new GeminiProvider(config.googleApiKey!);
  }
  
  // 2. Groq (Secondary)
  if (hasKey(config.groqApiKey)) {
    console.log("Using Provider: Groq");
    return new GroqProvider(config.groqApiKey!);
  }

  // 3. Hugging Face (Fallback)
  if (hasKey(config.huggingFaceApiKey)) {
    console.log("Using Provider: HuggingFace");
    return new HuggingFaceProvider(config.huggingFaceApiKey!);
  }
  
  throw new Error("Missing API Key. Please add GOOGLE_API_KEY to your .env file.");
};

// --- Report Factory (Strict Priority: Gemini -> HF) ---
export const getReportLLM = (): LLMProvider => {
  return getLLMProvider(); 
};
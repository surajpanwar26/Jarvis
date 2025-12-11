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
          jsonMode: params.jsonMode,
          provider: "huggingface" // Specify provider for backend routing
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HuggingFace API Error: ${response.status} - ${errorText}`);
      }
      
      // Handle empty responses
      const responseText = await response.text();
      if (!responseText || responseText.trim() === '') {
        console.warn("HuggingFace provider returned empty response");
        throw new Error("HuggingFace provider returned empty response");
      }
      
      // Try to parse JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.warn("HuggingFace provider returned malformed JSON:", responseText);
        throw new Error(`HuggingFace provider returned malformed JSON: ${responseText.substring(0, 100)}...`);
      }
      
      // Check if this is a fallback response and handle appropriately
      if (data.provider === "Fallback") {
        console.warn("HuggingFace provider fell back to fallback response");
        // Return the fallback content but don't throw an error
        return data.content || data.result || "";
      }
      return data.result || data.content || "";
    } catch (error) {
      console.error("HuggingFace Generation Failed:", error);
      // Re-throw the error to allow proper fallback handling
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
        const errorText = await response.text();
        throw new Error(`Groq API Error: ${response.status} - ${errorText}`);
      }
      
      // Handle empty responses
      const responseText = await response.text();
      if (!responseText || responseText.trim() === '') {
        console.warn("Groq provider returned empty response");
        throw new Error("Groq provider returned empty response");
      }
      
      // Try to parse JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.warn("Groq provider returned malformed JSON:", responseText);
        throw new Error(`Groq provider returned malformed JSON: ${responseText.substring(0, 100)}...`);
      }
      
      // Check if this is a fallback response and handle appropriately
      if (data.provider === "Fallback") {
        console.warn("Groq provider fell back to fallback response");
        // Return the fallback content but don't throw an error
        return data.content || data.result || "";
      }
      return data.result || data.content || "";
    } catch (error) {
      console.error("Groq Generation Failed:", error);
      // Re-throw the error to allow proper fallback handling
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
      
      // Handle empty responses
      const responseText = await response.text();
      if (!responseText || responseText.trim() === '') {
        console.warn("Gemini provider returned empty response");
        throw new Error("Gemini provider returned empty response");
      }
      
      // Try to parse JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.warn("Gemini provider returned malformed JSON:", responseText);
        throw new Error(`Gemini provider returned malformed JSON: ${responseText.substring(0, 100)}...`);
      }
      
      // Check if this is a fallback response and handle appropriately
      if (data.provider === "Fallback") {
        console.warn("Gemini provider fell back to fallback response");
        // Return the fallback content but don't throw an error
        return data.content || "";
      }
      return data.content || "";
    } catch (e: any) {
      console.error("Gemini Generation Failed:", e.message);
      // Check if this is a quota limit error
      if (e.message.includes('API Limit Reached') || e.message.includes('quota') || e.message.includes('limit')) {
        throw new Error(`Google API Limit Reached. Please wait for quota reset or use alternative providers.`);
      }
      // Re-throw the error to allow proper fallback handling
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

// --- Report Factory with Fallback Support ---
export const getReportLLM = (): LLMProvider => {
  // Create a fallback provider that tries multiple providers
  return new FallbackProvider([
    hasKey(config.googleApiKey) ? new GeminiProvider(config.googleApiKey!) : null,
    hasKey(config.groqApiKey) ? new GroqProvider(config.groqApiKey!) : null,
    hasKey(config.huggingFaceApiKey) ? new HuggingFaceProvider(config.huggingFaceApiKey!) : null
  ].filter(provider => provider !== null) as LLMProvider[]);
};

// --- Fallback Provider Implementation ---
class FallbackProvider implements LLMProvider {
  private providers: LLMProvider[];
  
  constructor(providers: LLMProvider[]) {
    this.providers = providers;
  }
  
  async generate(params: GenerationParams): Promise<string> {
    if (this.providers.length === 0) {
      throw new Error("No providers available for fallback");
    }
    
    const errors: string[] = [];
    
    for (let i = 0; i < this.providers.length; i++) {
      try {
        console.log(`Attempting generation with provider ${i + 1}/${this.providers.length}`);
        const result = await this.providers[i].generate(params);
        console.log(`Successfully generated content with provider ${i + 1}`);
        return result;
      } catch (error: any) {
        console.warn(`Provider ${i + 1} failed:`, error.message);
        errors.push(`Provider ${i + 1}: ${error.message}`);
        
        // If this is the last provider, re-throw the error
        if (i === this.providers.length - 1) {
          throw new Error(`All providers failed. Errors: ${errors.join('; ')}`);
        }
        
        // Continue to next provider
        console.log(`Falling back to next provider...`);
      }
    }
    
    throw new Error(`All providers failed. Errors: ${errors.join('; ')}`);
  }
  
  async *generateStream(params: GenerationParams): AsyncGenerator<string, void, unknown> {
    if (this.providers.length === 0) {
      throw new Error("No providers available for fallback");
    }
    
    const errors: string[] = [];
    
    for (let i = 0; i < this.providers.length; i++) {
      try {
        console.log(`Attempting stream generation with provider ${i + 1}/${this.providers.length}`);
        const stream = this.providers[i].generateStream(params);
        for await (const chunk of stream) {
          yield chunk;
        }
        console.log(`Successfully streamed content with provider ${i + 1}`);
        return;
      } catch (error: any) {
        console.warn(`Provider ${i + 1} failed:`, error.message);
        errors.push(`Provider ${i + 1}: ${error.message}`);
        
        // If this is the last provider, re-throw the error
        if (i === this.providers.length - 1) {
          throw new Error(`All providers failed. Errors: ${errors.join('; ')}`);
        }
        
        // Continue to next provider
        console.log(`Falling back to next provider...`);
      }
    }
    
    throw new Error(`All providers failed. Errors: ${errors.join('; ')}`);
  }
}

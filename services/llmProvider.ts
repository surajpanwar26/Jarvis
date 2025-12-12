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
  private baseUrl = getEnv('HUGGINGFACE_API_URL') || "https://router.huggingface.co/models/Qwen/Qwen2.5-7B-Instruct";  // Updated to use router endpoint

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generate(params: GenerationParams): Promise<string> {
    // Optimize token usage based on request type
    const isReportGeneration = params.prompt.toLowerCase().includes("report") || 
                              (params.systemInstruction && params.systemInstruction.toLowerCase().includes("report"));
    
    const fullPrompt = `<|user|>
${params.systemInstruction || "You are a helpful assistant."}${params.jsonMode ? " Output strict JSON only." : ""}

${params.prompt}
<|end|>
<|assistant|>
`;    try {
      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          inputs: fullPrompt,
          parameters: {
            max_new_tokens: isReportGeneration ? 4096 : 2048, // Reduced tokens for non-report generation
            return_full_text: false,
            temperature: 0.7
          }
        })
      });

      if (!response.ok) {
          throw new Error(`HuggingFace API Error: ${response.statusText}`);
      }
      
      const data = await response.json();
      let text = Array.isArray(data) ? data[0]?.generated_text : data?.generated_text;
      return text || "";
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
  private baseUrl = getEnv('GROQ_API_URL') || "https://api.groq.com/openai/v1/chat/completions";
  private model = getEnv('GROQ_MODEL') || "llama-3.3-70b-versatile";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generate(params: GenerationParams): Promise<string> {
    // Optimize token usage based on request type
    const isReportGeneration = params.prompt.toLowerCase().includes("report") || 
                              (params.systemInstruction && params.systemInstruction.toLowerCase().includes("report"));
    
    const messages = [
      { role: "system", content: params.systemInstruction || "You are a helpful research assistant." },
      { role: "user", content: params.prompt }
    ];

    if (params.jsonMode) {
      messages[0] = { ...messages[0], content: messages[0].content + " You must output valid JSON only." };
    }

    try {
      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: this.model,
          messages: messages,
          temperature: 0.5,
          max_tokens: isReportGeneration ? 4096 : 2048, // Reduced tokens for non-report generation
          response_format: params.jsonMode ? { type: "json_object" } : undefined
        })
      });

      if (!response.ok) {
         const err = await response.text();
         throw new Error(`Groq API Error (${response.status}): ${err}`);
      }
      const data = await response.json();
      return data.choices[0]?.message?.content || "";
    } catch (error) {
      console.error("Groq Generation Failed:", error);
      throw error;
    }
  }

  async *generateStream(params: GenerationParams): AsyncGenerator<string, void, unknown> {
    const text = await this.generate(params);
    yield text;
  }
}

// --- 3. Google Gemini Implementation (PRIMARY) ---
class GeminiProvider implements LLMProvider {
  private apiKey: string;
  private model = getEnv('GEMINI_MODEL') || "gemini-2.5-flash";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generate(params: GenerationParams): Promise<string> {
    try {
      // Instead of making direct calls to Google API, use our backend endpoint
      const response = await fetch(getApiUrl('/api/llm/generate'), {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          prompt: params.prompt,
          system_instruction: params.systemInstruction,
          json_mode: params.jsonMode,
          thinking_budget: params.thinkingBudget
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
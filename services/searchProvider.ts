import { config, hasKey } from "./config";
import { GoogleGenAI } from "@google/genai";
import { Source } from "../types";

interface SearchResult {
  text: string;
  sources: Source[];
  images: string[];
}

// --- 1. Tavily Implementation (Primary) ---
// Docs: https://docs.tavily.com/docs/tavily-api/rest_api
const tavilySearch = async (query: string): Promise<SearchResult> => {
  if (!config.tavilyApiKey) throw new Error("Tavily Key missing");

  try {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        api_key: config.tavilyApiKey,
        query: query,
        search_depth: "advanced", 
        include_images: true,
        include_answer: true, 
        max_results: 10, // Increased limit for more data
        include_raw_content: false 
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Tavily API Error: ${response.status} - ${errText}`);
    }
    
    const data = await response.json();

    let text = "";
    if (data.answer) {
      text += `### Direct Summary:\n${data.answer}\n\n`;
    }
    
    if (data.results && Array.isArray(data.results)) {
      text += data.results.map((r: any) => `Title: ${r.title}\nURL: ${r.url}\nContent: ${r.content}`).join("\n\n");
    }
    
    const sources = Array.isArray(data.results) 
      ? data.results.map((r: any) => ({ title: r.title, uri: r.url }))
      : [];
      
    const images = Array.isArray(data.images) ? data.images : [];

    return { text, sources, images };
  } catch (error) {
    console.error("Tavily search execution failed:", error);
    throw error;
  }
};

// --- 2. Gemini Grounding Implementation (Fallback) ---
const geminiSearch = async (query: string): Promise<SearchResult> => {
  if (!config.googleApiKey) throw new Error("No Google API Key for search fallback");
  
  const ai = new GoogleGenAI({ apiKey: config.googleApiKey });
  
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `You are a search engine. Perform a comprehensive real-time Google Search for: "${query}".
    
    Provide a very detailed summary of the findings, prioritizing data, statistics, and concrete facts.
    Include as many relevant details as possible.
    
    If you find images, include them in the text as Markdown: ![alt text](url).`,
    config: { 
      tools: [{ googleSearch: {} }],
      thinkingConfig: { thinkingBudget: 0 } 
    },
  });

  const text = response.text || "";
  const sources: Source[] = [];
  const images: string[] = [];

  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
  if (chunks) {
    chunks.forEach((chunk: any) => {
      if (chunk.web) {
        sources.push({ title: chunk.web.title, uri: chunk.web.uri });
      }
    });
  }

  const imgRegex = /!\[.*?\]\((.*?)\)/g;
  let match;
  while ((match = imgRegex.exec(text)) !== null) {
    if (match[1].startsWith('http')) {
      images.push(match[1]);
    }
  }

  return { text, sources, images };
};

// --- Unsplash Image Fallback ---
const unsplashImages = async (query: string): Promise<string[]> => {
  if (!hasKey(config.unsplashAccessKey)) return [];
  try {
    const res = await fetch(`https://api.unsplash.com/search/photos?page=1&query=${encodeURIComponent(query)}&client_id=${config.unsplashAccessKey}&per_page=5`);
    if (!res.ok) return [];
    
    const data = await res.json();
    return data.results.map((img: any) => img.urls.small);
  } catch (e) {
    return [];
  }
};

export const performSearch = async (query: string): Promise<SearchResult> => {
  let result: SearchResult = { text: "", sources: [], images: [] };
  let usedFallback = false;

  try {
    if (hasKey(config.tavilyApiKey)) {
      result = await tavilySearch(query);
    } else {
      usedFallback = true;
    }
  } catch (e) {
    console.warn("Tavily failed, switching to Gemini.", e);
    usedFallback = true;
  }

  if (usedFallback) {
    try {
      result = await geminiSearch(query);
    } catch (e) {
      console.error("All search providers failed", e);
      return { text: "Search failed. Check API Quotas.", sources: [], images: [] };
    }
  }

  if (result.images.length === 0 && hasKey(config.unsplashAccessKey)) {
    try {
      const extraImages = await unsplashImages(query);
      result.images = extraImages;
    } catch (e) {
      console.warn("Unsplash fetch failed", e);
    }
  }

  return result;
};

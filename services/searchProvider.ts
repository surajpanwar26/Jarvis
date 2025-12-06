
import { config, hasKey } from "./config";
import { GoogleGenAI } from "@google/genai";
import { Source } from "../types";

interface SearchResult {
  text: string;
  sources: Source[];
  images: string[];
}

// --- 1. Gemini Grounding Implementation (Primary/Fallback) ---
// This enables "Single API Key" mode using just the Google Key.
const geminiSearch = async (query: string): Promise<SearchResult> => {
  if (!config.googleApiKey) throw new Error("No Google API Key for search");
  
  const ai = new GoogleGenAI({ apiKey: config.googleApiKey });
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `You are a search engine. Perform a comprehensive real-time Google Search for: "${query}".
      
      1. Provide a very detailed summary of the findings, prioritizing data, statistics, and concrete facts.
      2. IMPORTANT: If you find relevant images in the search results, you MUST embed them in the text using Markdown format: ![alt text](url).
      3. Try to include at least 3 relevant images if possible.
      `,
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

    // Extract images from markdown
    const imgRegex = /!\[.*?\]\((.*?)\)/g;
    let match;
    while ((match = imgRegex.exec(text)) !== null) {
      if (match[1].startsWith('http')) {
        images.push(match[1]);
      }
    }

    return { text, sources, images };
  } catch (e) {
    console.error("Gemini Search Failed:", e);
    throw e;
  }
};

// --- 2. Tavily Implementation (Optional) ---
const tavilySearch = async (query: string): Promise<SearchResult> => {
  if (!config.tavilyApiKey) throw new Error("Tavily Key missing");

  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: config.tavilyApiKey,
      query: query,
      search_depth: "advanced", 
      include_images: true,
      include_answer: true, 
      max_results: 10
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    // Handle specific Tavily error cases
    if (response.status === 432) {
      throw new Error("Tavily API usage limit exceeded. Falling back to Google search.");
    } else if (response.status === 401) {
      throw new Error("Tavily API key is invalid. Falling back to Google search.");
    } else if (response.status === 429) {
      throw new Error("Tavily API rate limit exceeded. Falling back to Google search.");
    }
    throw new Error(`Tavily API Error: ${response.status} - ${errorText}`);
  }
  const data = await response.json();

  let text = data.answer || "";
  if (data.results) {
    text += data.results.map((r: any) => `\nTitle: ${r.title}\nContent: ${r.content}`).join("\n");
  }

  const sources = data.results?.map((r: any) => ({ title: r.title, uri: r.url })) || [];
  const images = data.images || [];

  return { text, sources, images };
};

// --- Image Augmentation ---
const augmentImages = async (query: string, currentImages: string[]): Promise<string[]> => {
    // If we have Pexels key, use it (High limit)
    if (hasKey(config.pexelsApiKey)) {
        try {
            const res = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=5`, {
            headers: { Authorization: config.pexelsApiKey! }
            });
            if (res.ok) {
                const data = await res.json();
                const newImgs = data.photos.map((img: any) => img.src.medium);
                return [...currentImages, ...newImgs];
            }
        } catch(e) {}
    }
    return currentImages;
};

export const performSearch = async (query: string): Promise<SearchResult> => {
  let result: SearchResult = { text: "", sources: [], images: [] };
  
  // Strategy: Prefer Tavily if key exists (better structured data), else strictly Gemini Search
  if (hasKey(config.tavilyApiKey)) {
    try {
      result = await tavilySearch(query);
    } catch (e: any) {
      console.warn("Tavily failed, failing over to Gemini:", e?.message || String(e));
      result = await geminiSearch(query);
    }
  } else {
    // Single Key Mode
    result = await geminiSearch(query);
  }

  // Enhance images if possible
  result.images = await augmentImages(query, result.images);
  
  return result;
};

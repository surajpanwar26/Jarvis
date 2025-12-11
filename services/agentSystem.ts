import { AgentEvent, AgentState, Source } from "../types";
import { getLLMProvider, getReportLLM } from "./llmProvider";
import { performSearch } from "./searchProvider";
import { api } from "./apiClient";

// --- Configuration ---
const MAX_UNIQUE_SOURCES = 10;
const MAX_UNIQUE_IMAGES = 10;

abstract class BaseAgent {
  constructor(protected emit: (event: AgentEvent) => void) {}
  abstract execute(state: AgentState): Promise<AgentState>;
}

// --- 1. EDITOR AGENT (PLANNER) ---
class EditorAgent extends BaseAgent {
  async execute(state: AgentState): Promise<AgentState> {
    const llm = getLLMProvider();
    this.emit({ type: 'agent_action', agentName: 'Editor', message: 'Analyzing request and outlining research strategy...', timestamp: new Date() });
    
    const count = state.isDeep ? 5 : 3;
    const prompt = `Topic: "${state.topic}"
Role: You are the Research Editor. Plan the outline.
Task: Generate ${count} specific, targeted search queries to cover this topic comprehensively.
Format: Return ONLY a raw JSON array of strings.`;

    try {
      const text = await llm.generate({
        prompt,
        systemInstruction: "Output JSON only.",
        jsonMode: true
      });
      
      // Clean up potential markdown code blocks from response
      const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
      let queries: string[] = [];
      
      try {
        const parsed = JSON.parse(jsonStr);
        if (Array.isArray(parsed)) {
          queries = parsed;
        } else {
          throw new Error("Parsed result is not an array");
        }
      } catch (parseErr) {
        console.warn("JSON Parsing failed, trying regex extraction...", parseErr);
        const arrayMatch = jsonStr.match(/\[[^\]]*\]/);
        if (arrayMatch) {
          try {
            const parsed = JSON.parse(arrayMatch[0]);
            if (Array.isArray(parsed)) {
              queries = parsed;
            } else {
              queries = [state.topic]; // Fallback
            }
          } catch (secondParseErr) {
            console.error("Second parsing attempt failed", secondParseErr);
            queries = [state.topic]; // Fallback
          }
        } else {
          queries = [state.topic]; // Ultimate fallback
        }
      }

      this.emit({ type: 'plan', agentName: 'Editor', message: `Research plan created with ${queries.length} queries`, data: queries, timestamp: new Date() });
      return { ...state, plan: queries };
    } catch (e: any) {
      console.error(e);
      this.emit({ type: 'error', message: `Planning failed: ${e.message}`, timestamp: new Date() });
      return { ...state, plan: [state.topic] }; // Fallback to basic search
    }
  }
}

// --- 2. RESEARCHER AGENT ---
class ResearcherAgent extends BaseAgent {
  async execute(state: AgentState): Promise<AgentState> {
    this.emit({ type: 'agent_action', agentName: 'Researcher', message: 'Executing web search...', timestamp: new Date() });

    const newContexts: string[] = [];
    const newSources: Source[] = [...state.sources];
    const seenUrls = new Set(state.sources.map(s => s.uri));

    // Deduplicate plan items
    const uniqueQueries = [...new Set(state.plan)];
    
    try {
      for (const query of uniqueQueries) {
        this.emit({ type: 'search', agentName: 'Researcher', message: `Searching: ${query}`, timestamp: new Date() });
        
        const result = await performSearch(query);
        
        // Process results
        // Add context
        if (result.text) {
          newContexts.push(result.text);
        }
        
        // Add sources
        for (const source of result.sources) {
          if (!seenUrls.has(source.uri)) {
            seenUrls.add(source.uri);
            newSources.push(source);
          }
        }
        
        // Add images to state for ImageAgent to process
        if (result.images && Array.isArray(result.images)) {
          // Store raw search results for ImageAgent to process
          state.rawSearchResults = state.rawSearchResults || [];
          state.rawSearchResults.push(result);
        }
        
        // Respect limits
        if (newSources.length >= MAX_UNIQUE_SOURCES) break;
      }

      this.emit({ type: 'agent_action', agentName: 'Researcher', message: `Web search completed. Found ${newContexts.length} new contexts.`, timestamp: new Date() });
      return { 
        ...state, 
        context: [...state.context, ...newContexts],
        sources: newSources
      };
    } catch (e: any) {
      console.error(e);
      this.emit({ type: 'error', message: `Research failed: ${e.message}`, timestamp: new Date() });
      return state; // Return unchanged state on error
    }
  }
}

// --- 3. IMAGE AGENT ---
class ImageAgent extends BaseAgent {
  async execute(state: AgentState): Promise<AgentState> {
    // Skip image extraction for quick research to optimize tokens
    if (!state.isDeep) {
      this.emit({ type: 'agent_action', agentName: 'ImageExtractor', message: 'Skipping image extraction for quick research to optimize token usage', timestamp: new Date() });
      return state;
    }

    this.emit({ type: 'agent_action', agentName: 'ImageExtractor', message: 'Extracting visual assets...', timestamp: new Date() });
    
    const seenImages = new Set(state.images);
    const newImages: string[] = [];

    try {
      // Extract images from raw search results first
      if (state.rawSearchResults && Array.isArray(state.rawSearchResults)) {
        for (const searchResult of state.rawSearchResults) {
          if (searchResult.images && Array.isArray(searchResult.images)) {
            for (const imgUrl of searchResult.images) {
              if (!seenImages.has(imgUrl) && newImages.length < MAX_UNIQUE_IMAGES) {
                seenImages.add(imgUrl);
                newImages.push(imgUrl);
                this.emit({ type: 'image', agentName: 'ImageExtractor', message: 'Visual asset intercepted', data: imgUrl, timestamp: new Date() });
              }
            }
          }
        }
      }
      
      // Fallback: extract image URLs from context
      const allContext = state.context.join(' ');
      const imageRegex = /(https?:\/\/[^\s]+?\.(?:jpg|jpeg|png|gif|webp))(?:\?[^\s]*)?/gi;
      let match;
      
      while ((match = imageRegex.exec(allContext)) !== null) {
        const imgUrl = match[1];
        if (!seenImages.has(imgUrl) && newImages.length < MAX_UNIQUE_IMAGES) {
          seenImages.add(imgUrl);
          newImages.push(imgUrl);
          this.emit({ type: 'image', agentName: 'ImageExtractor', message: 'Visual asset intercepted', data: imgUrl, timestamp: new Date() });
        }
      }

      this.emit({ type: 'agent_action', agentName: 'ImageExtractor', message: `Image extraction completed. Found ${newImages.length} new assets.`, timestamp: new Date() });
      return { ...state, images: [...state.images, ...newImages] };
    } catch (e: any) {
      console.error(e);
      this.emit({ type: 'error', message: `Image extraction failed: ${e.message}`, timestamp: new Date() });
      return state;
    }
  }
}

// --- 4. SOURCE AGENT ---
class SourceAgent extends BaseAgent {
  async execute(state: AgentState): Promise<AgentState> {
    // For quick research, we'll do minimal source processing to optimize tokens
    if (!state.isDeep) {
      this.emit({ type: 'agent_action', agentName: 'SourceProcessor', message: 'Minimal source processing for quick research to optimize token usage', timestamp: new Date() });
      // Just ensure we have unique sources without extensive processing
      const uniqueSources = state.sources.filter((source, index, self) => 
        index === self.findIndex(s => s.uri === source.uri)
      );
      return { ...state, sources: uniqueSources };
    }

    this.emit({ type: 'agent_action', agentName: 'SourceProcessor', message: 'Validating and enriching sources...', timestamp: new Date() });
    
    try {
      // Validate and enrich sources
      const enrichedSources: Source[] = [];
      const seenUrls = new Set();
      
      for (const source of state.sources) {
        // Dedupe
        if (seenUrls.has(source.uri)) continue;
        seenUrls.add(source.uri);
        
        // Minimal enrichment - in a production system, you might fetch page titles, etc.
        enrichedSources.push(source);
      }

      this.emit({ type: 'source', agentName: 'SourceProcessor', message: `Source validation completed. Total unique sources: ${enrichedSources.length}`, data: enrichedSources, timestamp: new Date() });
      return { ...state, sources: enrichedSources };
    } catch (e: any) {
      console.error(e);
      this.emit({ type: 'error', message: `Source processing failed: ${e.message}`, timestamp: new Date() });
      return state;
    }
  }
}

// --- 5. WRITER AGENT ---
class WriterAgent extends BaseAgent {
  async execute(state: AgentState): Promise<AgentState> {
    const llm = getReportLLM();
    
    this.emit({ type: 'agent_action', agentName: 'Writer', message: 'Drafting final report...', timestamp: new Date() });

    const role = state.isDeep ? "Chief Technical Writer" : "Briefing Specialist";
    const lengthGuidance = state.isDeep 
      ? "Create a comprehensive, well-structured report with detailed analysis and multiple sections. Aim for 2500+ words with proper headings, subheadings, and organized content, emphasizing a detailed executive summary with 5-6 paragraphs." 
      : "Create a comprehensive overview report with key points and essential insights. Aim for 1500-2000 words with proper structure, emphasizing a detailed executive summary with 3-5 paragraphs.";
    
    try {
      const stream = llm.generateStream({
        prompt: `Topic: ${state.topic}

Context Data:
${state.context.join('\n\n')}

${state.isDeep ? 
`Task: Create a comprehensive, well-structured report with the following structure:

# Executive Summary
Provide a comprehensive executive summary with 5-6 detailed paragraphs covering different aspects of the topic.

# Introduction
Provide background and context about the topic.

# Detailed Analysis
Create 4-5 main sections with detailed analysis.

# Key Findings
Present key findings as bullet points.

# Implications
Discuss the significance and potential implications.

# Conclusions and Recommendations
Summarize key conclusions and provide actionable recommendations.
` : 
`Task: Create a well-structured report with the following structure:

# Executive Summary
Provide a comprehensive executive summary with 3-5 detailed paragraphs.

# Analysis and Insights
Provide critical analysis with supporting evidence.

# Key Findings
Present key findings as bullet points.

# Implications
Discuss the significance and potential implications.

# Conclusions and Recommendations
Summarize key conclusions and provide actionable recommendations.
`}

Context Information:
${state.context.join('\n\n')}

Ensure the report is well-organized and professionally formatted using proper Markdown syntax with appropriate headings and lists. Create a comprehensive report that provides substantial insights while remaining focused. ${lengthGuidance} Use only information from the provided context.`,
        systemInstruction: `You are the ${role}. Structure the report professionally. ${lengthGuidance} Focus only on information that will be displayed in the UI. Create a well-organized, comprehensive report with proper headings, subheadings, and lists. Avoid unnecessary elaboration. If you encounter any issues with API providers, gracefully handle fallback scenarios and inform the user about any limitations in the final report.`,
        thinkingBudget: state.isDeep ? 1024 : undefined 
      });

      let fullReport = "";
      for await (const chunk of stream) {
        fullReport += chunk;
        this.emit({ type: 'report_chunk', agentName: 'Writer', message: 'typing...', data: chunk, timestamp: new Date() });
      }

      this.emit({ type: 'agent_action', agentName: 'Writer', message: 'Report drafting complete.', timestamp: new Date() });
      return { ...state, report: fullReport };
    } catch (e: any) {
      console.error(e);
      // Detailed error message in UI
      const errDetail = e.message || JSON.stringify(e);
      
      // Check if this is a fallback response or API limitation
      if (errDetail.includes('fallback') || errDetail.includes('Fallback') || 
          errDetail.includes('API Limit') || errDetail.includes('quota') || 
          errDetail.includes('limit') || errDetail.includes('failed') ||
          errDetail.includes('All providers failed')) {
        this.emit({ 
          type: 'agent_action', 
          agentName: 'Writer', 
          message: 'Using fallback response due to API limitations. Report may be less detailed than usual.', 
          timestamp: new Date() 
        });
        
        // Try one more time with a simplified prompt to increase chances of success
        try {
          const llm = getReportLLM();
          const simplifiedPrompt = `Create a concise report on "${state.topic}" based on the following context:
          
${state.context.slice(0, 3).join('\n\n')}

Provide a brief summary with key points and main findings. Format as Markdown with clear headings.`;
          
          const fallbackReport = await llm.generate({
            prompt: simplifiedPrompt,
            systemInstruction: "You are an AI assistant creating a concise report. Focus on clarity and key information.",
            jsonMode: false
          });
          
          if (fallbackReport && fallbackReport.length > 0) {
            this.emit({ 
              type: 'agent_action', 
              agentName: 'Writer', 
              message: 'Successfully generated simplified report using fallback provider.', 
              timestamp: new Date() 
            });
            
            return { ...state, report: fallbackReport };
          }
        } catch (fallbackError) {
          console.error("Fallback generation also failed:", fallbackError);
        }
        
        // If fallback also fails, return a graceful fallback response
        const fallbackReport = `# Report Generation Notice

Due to temporary API limitations, this report was generated using a fallback mechanism. The content may be less detailed than usual.

## Topic: ${state.topic}

${errDetail.includes('brief overview') ? errDetail.split('brief overview')[1] : errDetail}

---

*Note: This is a system-generated notice. Please try again later for a more comprehensive report or check your API key configurations.*`;

        return { ...state, report: fallbackReport };
      } else {
        this.emit({ type: 'error', message: `Drafting failed: ${errDetail}`, timestamp: new Date() });
        // Even if there's an error, we should still try to provide some content to the user
        // rather than completely failing
        const errorReport = `# Report Generation Failed

We encountered an issue while generating your report:

**Error Details**: ${errDetail}

## Possible Solutions:
1. Check your API key configurations in the environment variables
2. Verify network connectivity to the API providers
3. Try again in a few minutes if this is a temporary issue
4. If the problem persists, consider using alternative API providers

## Topic: ${state.topic}

This is a placeholder report due to generation failure. Please try again later for a complete report.`;

        return { ...state, report: errorReport };
      }
    }
  }
}

// --- 6. PUBLISHER AGENT ---
class PublisherAgent extends BaseAgent {
  async execute(state: AgentState): Promise<AgentState> {
    this.emit({ type: 'agent_action', agentName: 'Publisher', message: 'Finalizing formatting and publishing...', timestamp: new Date() });
    this.emit({ type: 'complete', message: 'Research Published', data: { report: state.report, sources: state.sources, images: state.images }, timestamp: new Date() });
    return state;
  }
}

// --- CHIEF EDITOR (ORCHESTRATOR) ---
export class ResearchWorkflow {
  private listeners: ((event: AgentEvent) => void)[] = [];

  public subscribe(callback: (event: AgentEvent) => void) {
    this.listeners.push(callback);
    return () => { this.listeners = this.listeners.filter(cb => cb !== callback); };
  }

  private emit(event: AgentEvent) {
    this.listeners.forEach(cb => cb(event));
  }

  public async start(topic: string, isDeep: boolean) {
    // 1. Check if Backend is available
    let useBackend = false;
    try {
      // Short timeout check
      useBackend = await api.health();
    } catch (e) {
      console.warn("Backend health check failed, using frontend-only mode", e);
    }

    // 2. Initialize Agents
    const editor = new EditorAgent(this.emit.bind(this));
    const researcher = new ResearcherAgent(this.emit.bind(this));
    const imager = new ImageAgent(this.emit.bind(this));
    const sourcer = new SourceAgent(this.emit.bind(this));
    const writer = new WriterAgent(this.emit.bind(this));
    const publisher = new PublisherAgent(this.emit.bind(this));

    // 3. Create Initial State
    const initialState: AgentState = {
      topic,
      isDeep,
      plan: [],
      context: [],
      sources: [],
      images: [],
      report: ""
    };

    // 4. Execute Agent Pipeline
    try {
      this.emit({ type: 'log', message: `Starting ${isDeep ? 'Deep' : 'Quick'} Research on: ${topic}`, timestamp: new Date() });
      
      // Stage 1: Planning
      const plannedState = await editor.execute(initialState);
      
      // Stage 2: Research
      const researchedState = await researcher.execute(plannedState);
      
      // Stage 3: Image Extraction (skip for quick research to optimize tokens)
      const imagedState = await imager.execute(researchedState);
      
      // Stage 4: Source Processing
      const sourcedState = await sourcer.execute(imagedState);
      
      // Stage 5: Writing
      const writtenState = await writer.execute(sourcedState);
      
      // Stage 6: Publishing
      const finalState = await publisher.execute(writtenState);
      
      this.emit({ type: 'log', message: 'Research Pipeline Completed Successfully', timestamp: new Date() });
      return finalState;
    } catch (e: any) {
      console.error("Pipeline Error", e);
      this.emit({ type: 'error', message: `Pipeline crashed: ${e.message}`, timestamp: new Date() });
      throw e;
    }
  }
}
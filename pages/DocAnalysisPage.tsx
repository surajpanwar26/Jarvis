import React, { useState, useEffect, useRef } from 'react';
import { ResearchLogs } from '../components/ResearchLogs';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { ChatPanel } from '../components/ChatPanel';
import { WaveLoader } from '../components/WaveLoader';
import { FileUploader } from '../components/FileUploader';
import { ActivityIcon, ArrowLeftIcon, DownloadIcon, FileIcon } from '../components/Icons';
import { ResearchStatus, LogEntry, ResearchResult, ChatMessage } from '../types';
import { askFollowUp, analyzeDocument } from '../services/analysisService';
import { logActivity } from '../services/mongoService';
import { exportToPDF, exportToDOCX } from '../services/exportService';

const generateId = () => Math.random().toString(36).substr(2, 9);

interface DocAnalysisPageProps {
  initialFile?: File;
  onBack: () => void;
}

export const DocAnalysisPage: React.FC<DocAnalysisPageProps> = ({ initialFile, onBack }) => {
  const [status, setStatus] = useState<ResearchStatus>(ResearchStatus.IDLE);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [result, setResult] = useState<ResearchResult | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [docName, setDocName] = useState('');
  const [showExportMenu, setShowExportMenu] = useState(false);
  
  const hasStarted = useRef(false);

  useEffect(() => {
    if (initialFile && !hasStarted.current) {
       handleFileUpload(initialFile);
       hasStarted.current = true;
    }
  }, [initialFile]);

  const handleFileUpload = async (file: File) => {
    setStatus(ResearchStatus.PLANNING);
    setDocName(file.name);
    setLogs([]);
    setLogs(p => [...p, { id: generateId(), message: `Ingesting ${file.name}...`, timestamp: new Date(), type: 'system' }]);
    
    logActivity({
      actionType: 'DOC_ANALYSIS',
      documentName: file.name,
      documentFormat: file.type
    });

    try {
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
             const base64 = (e.target?.result as string).split(',')[1];
             setStatus(ResearchStatus.SYNTHESIZING);
             setLogs(p => [...p, { id: generateId(), message: 'RAG Protocol: Retrieving key contexts...', timestamp: new Date(), type: 'info' }]);
             
             const data = await analyzeDocument(base64, file.type || 'text/plain');
             setResult(data);
             setStatus(ResearchStatus.COMPLETED);
             setLogs(p => [...p, { id: generateId(), message: 'Analysis Complete', timestamp: new Date(), type: 'success' }]);
             
             // Initialize chat with a welcome message
             setChatMessages([{
               id: generateId(),
               role: 'assistant',
               content: `I've analyzed the document "${file.name}" and am ready to answer your questions about its content. What would you like to know?`,
               timestamp: new Date()
             }]);
          } catch (analysisError: any) {
             setStatus(ResearchStatus.ERROR);
             setLogs(p => [...p, { id: generateId(), message: `Analysis Error: ${analysisError.message}`, timestamp: new Date(), type: 'error' }]);
          }
        };
        reader.readAsDataURL(file);
    } catch (e: any) {
        setStatus(ResearchStatus.ERROR);
        setLogs(p => [...p, { id: generateId(), message: `Upload Failed: ${e.message}`, timestamp: new Date(), type: 'error' }]);
    }
  };

  const handleChat = async (question: string) => {
    if (!result) return;
    
    logActivity({
      actionType: 'DOC_ANALYSIS',
      query: question,
      documentName: docName
    });

    setChatMessages(p => [...p, { id: generateId(), role: 'user', content: question, timestamp: new Date() }]);
    setIsLoadingChat(true);
    
    try {
        const answer = await askFollowUp(chatMessages, result.report, question);
        setChatMessages(p => [...p, { id: generateId(), role: 'assistant', content: answer, timestamp: new Date() }]);
    } catch (e: any) {
        setLogs(p => [...p, { id: generateId(), message: `Chat Error: ${e.message}`, timestamp: new Date(), type: 'error' }]);
        setChatMessages(p => [...p, { id: generateId(), role: 'assistant', content: "Error: Unable to fetch response.", timestamp: new Date() }]);
    } finally {
        setIsLoadingChat(false);
    }
  };

  const handleExport = (type: 'pdf' | 'docx') => {
    if (!result?.report) return;
    const title = docName || "Doc_Analysis_Report";
    
    if (type === 'pdf') exportToPDF(title, result.report);
    if (type === 'docx') exportToDOCX(title, result.report);
    setShowExportMenu(false);
  };

  return (
    <div className="h-full flex flex-col max-w-[1800px] mx-auto p-4 animate-fade-in font-sans">
      {/* Header */}
      <div className="mb-4 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <button 
              onClick={onBack} 
              className="flex items-center text-slate-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/5 text-sm"
          >
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              <span className="font-medium">New Analysis</span>
          </button>
          
          <div className="flex items-center space-x-3 bg-purple-500/10 border border-purple-500/20 px-4 py-2 rounded-full">
            <ActivityIcon className="w-5 h-5 text-purple-400" />
            <span className="font-bold tracking-wider text-sm text-purple-200 uppercase">Doc Intelligence</span>
          </div>

          {/* Export Dropdown */}
          <div className="relative">
             <button 
                onClick={() => setShowExportMenu(!showExportMenu)}
                disabled={!result}
                className="flex items-center space-x-2 bg-white/5 hover:bg-white/10 text-slate-300 px-4 py-2 rounded-lg text-sm font-medium border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
             >
                  <DownloadIcon className="w-4 h-4" />
                  <span>Export Report</span>
             </button>
             
             {showExportMenu && (
               <div className="absolute right-0 mt-2 w-48 bg-[#0F1629] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-fade-in">
                  <button onClick={() => handleExport('pdf')} className="w-full flex items-center px-4 py-3 hover:bg-white/5 text-slate-300 hover:text-white transition-colors text-sm text-left">
                     <FileIcon className="w-4 h-4 mr-2 text-red-400" /> Export as PDF
                  </button>
                  <button onClick={() => handleExport('docx')} className="w-full flex items-center px-4 py-3 hover:bg-white/5 text-slate-300 hover:text-white transition-colors text-sm text-left border-t border-white/5">
                     <FileIcon className="w-4 h-4 mr-2 text-blue-400" /> Export as DOCX
                  </button>
               </div>
             )}
          </div>
        </div>

        {/* Active Document Indicator */}
        {docName && (
          <div className="flex justify-center mt-2">
              <div className="text-xl font-display text-white border-b border-white/10 pb-2 px-8">
                 <span className="text-slate-500 mr-2 text-sm uppercase tracking-wide">Document:</span>
                 {docName}
              </div>
          </div>
        )}
      </div>

      {/* 3-Column Layout: Logs (Left) | Report (Middle) | Chat (Right) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 overflow-hidden min-h-0">
        
        {/* Left: Processing Logs */}
        <div className="lg:col-span-3 flex flex-col overflow-hidden h-full">
            <div className="flex-1 bg-black/20 rounded-xl border border-white/10 p-3 flex flex-col overflow-hidden shadow-xl">
              <h3 className="text-[10px] font-bold text-purple-500 uppercase tracking-widest mb-2 flex items-center">
                <span className="w-2 h-2 rounded-full bg-purple-500 mr-2 animate-pulse"></span>
                Processing Logs
              </h3>
              <div className="flex-1 overflow-y-auto bg-black/40 rounded border border-white/5 p-2 custom-scrollbar">
                <ResearchLogs logs={logs} />
              </div>
            </div>
        </div>

        {/* Middle: Report (Wider) */}
        <div className="lg:col-span-6 flex flex-col overflow-hidden h-full">
          <div className="flex-1 glass-card rounded-2xl border border-white/10 overflow-hidden flex flex-col shadow-2xl relative">
             {/* Report Header */}
             <div className="px-6 py-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
                <span className="text-xs font-bold text-purple-400 uppercase tracking-widest">Analysis Report</span>
                {status === ResearchStatus.SYNTHESIZING && <span className="text-xs text-slate-500 animate-pulse">Generating Report...</span>}
             </div>

             {/* Content */}
             <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-black/20">
                {(status === ResearchStatus.IDLE || status === ResearchStatus.PLANNING) && !result?.report ? (
                  // If idle and no initial file processed yet (or reset), show uploader
                  !initialFile ? (
                    <div className="h-full flex flex-col justify-center">
                       <FileUploader onFileSelect={handleFileUpload} isLoading={status !== ResearchStatus.IDLE} />
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                       <WaveLoader message="Ingesting Document Structure..." />
                    </div>
                  )
                ) : (
                  <>
                    {status === ResearchStatus.SYNTHESIZING && !result?.report ? (
                      <WaveLoader message="Generating Document Analysis Report..." />
                    ) : result?.report ? (
                      <>
                        <div className="mb-4 p-3 bg-green-900/20 border border-green-800/30 rounded-lg text-green-400 text-sm font-medium">
                          Document analysis complete for "{docName}"
                        </div>
                        <MarkdownRenderer content={result.report} />
                      </>
                    ) : (
                      <div className="text-center text-slate-500">
                        <p>No analysis report available.</p>
                        <p className="text-sm mt-2">Please upload a document to begin analysis.</p>
                      </div>
                    )}
                    {status === ResearchStatus.ERROR && !result?.report && (
                      <div className="text-red-400 text-center font-mono mt-10">
                        Analysis Failed. Check logs for details.
                      </div>
                    )}
                  </>
                )}
             </div>
          </div>
        </div>

        {/* Right: AI Chatbot */}
        <div className="lg:col-span-3 flex flex-col h-full overflow-hidden">
           <div className="flex-1 rounded-2xl overflow-hidden border border-white/10 shadow-xl bg-black/20 h-full sticky top-4">
              {result ? (
                <ChatPanel messages={chatMessages} onSendMessage={handleChat} isLoading={isLoadingChat} />
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-600 bg-white/5 p-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                    <ActivityIcon className="w-8 h-8 opacity-20" />
                  </div>
                  <p className="text-sm font-mono">Upload a document to enable AI Chatbot</p>
                  <p className="text-xs mt-2 text-slate-500">Ask questions about your document after analysis completes</p>
                </div>
              )}
           </div>
        </div>

      </div>
    </div>
  );
};
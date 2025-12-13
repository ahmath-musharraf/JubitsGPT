import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Message, Attachment } from '../types';
import { Bot, User, Copy, Check, FileText, Download, X, Maximize2, Sparkles, ListPlus, Image as ImageIcon, Video as VideoIcon, Volume2, StopCircle, Settings } from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';

interface MessageBubbleProps {
  message: Message;
  onSummarize?: (id: string) => void;
  highlight?: string;
  onFixError?: () => void;
}

const ImageAttachment: React.FC<{ att: Attachment; onZoom: (url: string) => void }> = ({ att, onZoom }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const src = att.url || `data:${att.mimeType};base64,${att.data}`;

  return (
    <div className="group/att relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900/50 transition-all hover:shadow-md w-full max-w-sm">
      {!isLoaded && (
        <div className="h-48 w-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 animate-pulse">
          <ImageIcon className="text-slate-300 dark:text-slate-600 opacity-50" size={32} />
        </div>
      )}
      <div 
        className={`relative cursor-zoom-in flex justify-center bg-black/5 dark:bg-black/20 ${!isLoaded ? 'hidden' : ''}`} 
        onClick={() => onZoom(src)}
      >
        <img 
          src={src} 
          alt={att.name} 
          className="max-h-[300px] w-auto max-w-full object-contain rounded-lg"
          onLoad={() => setIsLoaded(true)}
        />
        <div className="absolute inset-0 bg-black/0 group-hover/att:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover/att:opacity-100">
          <div className="bg-black/50 text-white p-1.5 rounded-full backdrop-blur-sm">
            <Maximize2 size={16} />
          </div>
        </div>
      </div>
    </div>
  );
};

const VideoAttachment: React.FC<{ att: Attachment }> = ({ att }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const src = att.url || `data:${att.mimeType};base64,${att.data}`;

  return (
    <div className="group/att relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900/50 transition-all hover:shadow-md w-full max-w-sm">
      {!isLoaded && (
        <div className="h-48 w-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 animate-pulse">
           <VideoIcon className="text-slate-300 dark:text-slate-600 opacity-50" size={32} />
        </div>
      )}
      <div className={`w-full ${!isLoaded ? 'hidden' : ''}`}>
         <video 
           controls 
           className="w-full rounded-lg max-h-[300px]" 
           src={src}
           onLoadedData={() => setIsLoaded(true)}
         >
           Your browser does not support the video tag.
         </video>
         <div className="flex justify-between items-center p-2 text-xs text-slate-500 dark:text-slate-400">
            <span>{att.name}</span>
            <a 
               href={src} 
               download={att.name}
               className="text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400"
            >
              Download
            </a>
         </div>
      </div>
    </div>
  );
};

const FileAttachment: React.FC<{ att: Attachment; formatBytes: (b?: number) => string }> = ({ att, formatBytes }) => {
  const src = att.url || `data:${att.mimeType};base64,${att.data}`;
  
  const formatDate = (timestamp?: number) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="group/att relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900/50 transition-all hover:shadow-md w-full max-w-sm">
      <div className="flex items-center gap-3 p-3 min-w-[220px]">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
          <FileText size={20} />
        </div>
        <div className="flex-1 overflow-hidden min-w-0">
          <div className="truncate text-sm font-medium text-slate-700 dark:text-slate-200" title={att.name}>
            {att.name}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <span>{formatBytes(att.size)}</span>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <span>{att.mimeType.split('/')[1]?.toUpperCase() || 'FILE'}</span>
            {att.lastModified && (
              <>
                <span className="text-slate-300 dark:text-slate-600">•</span>
                <span>{formatDate(att.lastModified)}</span>
              </>
            )}
          </div>
        </div>
        <a 
          href={src} 
          download={att.name}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-200 hover:text-indigo-600 dark:hover:bg-slate-700 dark:hover:text-indigo-400 transition-colors"
          title="Download"
          onClick={(e) => e.stopPropagation()}
        >
          <Download size={16} />
        </a>
      </div>
    </div>
  );
};

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onSummarize, highlight, onFixError }) => {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(message.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSpeak = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      const utterance = new SpeechSynthesisUtterance(message.text);
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  // Cleanup speech on unmount
  useEffect(() => {
    return () => {
      if (isSpeaking) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isSpeaking]);

  const formatBytes = (bytes?: number) => {
    if (!bytes && bytes !== 0) return '';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Helper to highlight user text
  const renderUserText = (text: string) => {
    if (!highlight) return text;
    try {
      const escapedHighlight = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const parts = text.split(new RegExp(`(${escapedHighlight})`, 'gi'));
      return parts.map((part, i) => 
        part.toLowerCase() === highlight.toLowerCase() ? (
          <mark key={i} className="bg-yellow-200 dark:bg-yellow-500/40 text-slate-900 dark:text-white rounded-sm px-0.5 mx-0.5 font-medium">
            {part}
          </mark>
        ) : part
      );
    } catch (e) {
      return text;
    }
  };

  // Format timestamp
  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    }).format(date);
  };

  const isApiKeyError = message.text && message.text.includes("API Key");

  return (
    <>
      <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-6 group`}>
        <div className={`flex max-w-[85%] md:max-w-[75%] gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
          
          {/* Avatar */}
          <div className={`
            flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-1 shadow-md
            ${isUser 
              ? 'bg-indigo-600 text-white' 
              : 'bg-emerald-500/90 dark:bg-emerald-600/90 text-white'
            }
          `}>
            {isUser ? <User size={16} /> : <Bot size={16} />}
          </div>

          {/* Message Content */}
          <div 
            tabIndex={!isUser ? 0 : -1}
            className={`
            relative flex flex-col p-4 rounded-2xl shadow-sm text-sm md:text-base leading-relaxed overflow-hidden transition-all duration-300 outline-none
            ${isUser 
              ? 'bg-indigo-600 hover:bg-indigo-500 text-white rounded-tr-sm' 
              : 'bg-white dark:bg-slate-800 hover:shadow-md dark:hover:shadow-slate-900/50 text-slate-800 dark:text-slate-200 rounded-tl-sm border border-slate-200 dark:border-slate-700/50 pr-10 focus-visible:ring-2 focus-visible:ring-indigo-500 dark:focus-visible:ring-indigo-400 focus-visible:border-transparent'
            }
          `}>
            {/* Action Buttons (Bot only) */}
            {!isUser && !message.isStreaming && !message.isError && (
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity z-10">
                 {/* Summarize Button */}
                 {onSummarize && !message.summary && (
                   <button
                     onClick={() => onSummarize(message.id)}
                     className="p-1.5 text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                     title="Summarize message"
                     aria-label="Summarize message"
                     disabled={message.isSummarizing}
                   >
                     {message.isSummarizing ? (
                       <div className="animate-spin rounded-full h-3 w-3 border-2 border-indigo-500 border-t-transparent" />
                     ) : (
                       <ListPlus size={16} />
                     )}
                   </button>
                 )}
                 {/* Speak Button */}
                 <button
                    onClick={handleSpeak}
                    className={`p-1.5 transition-all rounded focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${isSpeaking ? 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30' : 'text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                    title={isSpeaking ? "Stop speaking" : "Read aloud"}
                    aria-label={isSpeaking ? "Stop speaking" : "Read aloud"}
                  >
                    {isSpeaking ? <StopCircle size={16} /> : <Volume2 size={16} />}
                  </button>
                 {/* Copy Button */}
                 <button
                    onClick={handleCopy}
                    className="p-1.5 text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    title="Copy response"
                    aria-label="Copy response to clipboard"
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                  </button>
              </div>
            )}

            {/* Attachments */}
            {message.attachments && message.attachments.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {message.attachments.map((att, index) => (
                  <React.Fragment key={index}>
                    {att.type === 'image' && <ImageAttachment att={att} onZoom={setZoomedImage} />}
                    {att.type === 'video' && <VideoAttachment att={att} />}
                    {att.type === 'file' && <FileAttachment att={att} formatBytes={formatBytes} />}
                  </React.Fragment>
                ))}
              </div>
            )}

            {isUser ? (
               // User messages are typically plain text
              <div className="whitespace-pre-wrap font-sans">{renderUserText(message.text)}</div>
            ) : (
              // Bot messages support Markdown
              <MarkdownRenderer content={message.text} isStreaming={message.isStreaming} highlight={highlight} />
            )}
            
            {/* Summary Section */}
            {message.summary && (
               <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700/50 animate-fade-in">
                  <div className="text-xs font-semibold text-indigo-500 dark:text-indigo-400 mb-1 flex items-center gap-1">
                     <Sparkles size={12} /> Summary
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-300 italic bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                     {message.summary}
                  </div>
               </div>
            )}
            
            {message.isError && (
               <div className="mt-3 flex flex-col gap-2">
                 <div className="text-xs text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2.5 rounded border border-red-200 dark:border-red-900/30">
                    Failed to send message. Please try again.
                 </div>
                 {isApiKeyError && onFixError && (
                   <button 
                     onClick={onFixError}
                     className="flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg transition-colors w-fit"
                   >
                     <Settings size={14} />
                     Fix API Key Settings
                   </button>
                 )}
               </div>
            )}

            {/* Timestamp on Hover */}
            <div 
              className={`
                mt-1 text-[10px] text-right opacity-0 group-hover:opacity-100 transition-opacity duration-300 select-none
                ${isUser ? 'text-indigo-200' : 'text-slate-400'}
              `}
            >
              {formatTime(new Date(message.timestamp))}
            </div>
          </div>
        </div>
      </div>

      {/* Full Screen Image Lightbox */}
      {zoomedImage && createPortal(
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 transition-opacity animate-in fade-in duration-200"
          onClick={() => setZoomedImage(null)}
        >
           <button 
             className="absolute top-4 right-4 p-2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md transition-colors"
             onClick={() => setZoomedImage(null)}
           >
             <X size={24} />
           </button>
           <img 
             src={zoomedImage} 
             alt="Zoomed preview" 
             className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-200"
             onClick={(e) => e.stopPropagation()} 
           />
        </div>,
        document.body
      )}
    </>
  );
};

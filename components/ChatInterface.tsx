import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, RefreshCw, ArrowDown, Trash2, Mic, MicOff, Paperclip, X, FileText, Image as ImageIcon, Video as VideoIcon, MessageSquare, Eye, EyeOff, ListPlus, StopCircle, Sparkles, Code, Search, Wand2, Download } from 'lucide-react';
import { MessageBubble } from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import { initializeChat, sendMessageStream, generateImageContent, generateVideoContent, generateSummary, enhancePrompt } from '../services/gemini';
import { Message, Attachment, GenerationMode } from '../types';
import { GenerateContentResponse } from '@google/genai';
import MarkdownRenderer from './MarkdownRenderer';

const SUGGESTIONS = [
  { icon: <ImageIcon size={18}/>, text: "Generate a futuristic cyberpunk city", mode: 'image' as GenerationMode },
  { icon: <MessageSquare size={18}/>, text: "Explain quantum computing simply", mode: 'chat' as GenerationMode },
  { icon: <Code size={18}/>, text: "Write a React component for a navbar", mode: 'code' as GenerationMode },
  { icon: <VideoIcon size={18}/>, text: "Create a video of a robot dancing", mode: 'video' as GenerationMode },
];

interface ChatInterfaceProps {
  initialMessages?: Message[];
  onUpdateMessages?: (messages: Message[]) => void;
  onNewChat?: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ initialMessages = [], onUpdateMessages, onNewChat }) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages.length > 0 ? initialMessages : [
    {
      id: 'welcome',
      role: 'model',
      text: "Hello! I'm JubitsGPT. How can I help you today?",
      timestamp: new Date(),
    }
  ]);
  
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [mode, setMode] = useState<GenerationMode>('chat');
  const [showPreview, setShowPreview] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const prevMessagesLengthRef = useRef(messages.length);
  const abortControllerRef = useRef<boolean>(false);

  useEffect(() => {
    // Wrap initialization in try-catch to avoid crashing UI if API key is missing
    try {
      if (initialMessages.length > 0) {
        const validHistory = initialMessages.filter(m => !m.isError && m.id !== 'welcome');
        if (validHistory.length > 0) {
          const historyForGemini = validHistory.map(m => ({
            role: m.role,
            parts: [{ text: m.text }] 
          }));
          initializeChat('gemini-2.5-flash', historyForGemini);
        } else {
          initializeChat();
        }
      } else {
        initializeChat();
      }
    } catch (e) {
      console.warn("Initialization failed (likely missing API key). This is expected on first load if key is not set.", e);
    }
  }, []); 

  useEffect(() => {
    if (onUpdateMessages) {
      onUpdateMessages(messages);
    }
  }, [messages, onUpdateMessages]);

  useEffect(() => {
    if (typeof window !== 'undefined' && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)) {
      setIsSpeechSupported(true);
    }
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input, attachments]);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  useEffect(() => {
    const chatContainer = chatContainerRef.current;
    if (!chatContainer) return;

    const isNewMessage = messages.length > prevMessagesLengthRef.current;
    prevMessagesLengthRef.current = messages.length;

    const { scrollTop, scrollHeight, clientHeight } = chatContainer;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;

    if ((isNewMessage || isNearBottom) && !searchQuery) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, searchQuery]);

  const handleScroll = () => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollBottom(!isNearBottom);
    }
  };

  const clearChat = () => {
    if (onNewChat) {
      onNewChat();
    } else {
      try {
        initializeChat(); 
      } catch (e) {
        console.warn("Failed to reset chat:", e);
      }
      setMessages([
        {
          id: crypto.randomUUID(),
          role: 'model',
          text: "Chat cleared. What would you like to discuss now?",
          timestamp: new Date(),
        }
      ]);
      setAttachments([]);
      setSearchQuery('');
      setIsSearchOpen(false);
    }
  };

  const handleExportChat = () => {
    if (messages.length === 0) return;
    
    const chatText = messages.map(m => {
        const role = m.role === 'user' ? 'User' : 'AI';
        const time = new Date(m.timestamp).toLocaleString();
        return `[${time}] ${role}:\n${m.text}\n`;
    }).join('\n---\n\n');

    const blob = new Blob([chatText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jubitsgpt-chat-${new Date().toISOString().slice(0,10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleEnhancePrompt = async () => {
    if (!input.trim() || isEnhancing) return;
    setIsEnhancing(true);
    try {
        const enhanced = await enhancePrompt(input);
        setInput(enhanced);
    } catch (e) {
        console.error("Enhance failed", e);
    } finally {
        setIsEnhancing(false);
    }
  };

  const handleSummarizeMessage = async (id: string) => {
    const msg = messages.find(m => m.id === id);
    if (!msg) return;

    setMessages(prev => prev.map(m => m.id === id ? { ...m, isSummarizing: true } : m));

    try {
      const summary = await generateSummary(msg.text);
      setMessages(prev => prev.map(m => m.id === id ? { ...m, isSummarizing: false, summary } : m));
    } catch (error) {
      console.error("Summary error:", error);
      setMessages(prev => prev.map(m => m.id === id ? { ...m, isSummarizing: false } : m));
    }
  };

  const handleSummarizeChat = async () => {
    if (messages.length === 0 || isLoading) return;
    
    setIsLoading(true);
    const summaryId = crypto.randomUUID();
    
    setMessages(prev => [...prev, {
      id: summaryId,
      role: 'model',
      text: '',
      timestamp: new Date(),
      isStreaming: true
    }]);

    try {
      const fullConversation = messages
        .filter(m => !m.isError)
        .map(m => `${m.role === 'user' ? 'User' : 'JubitsGPT'}: ${m.text}`)
        .join('\n\n');

      const summary = await generateSummary(fullConversation);
      
      setMessages(prev => prev.map(m => m.id === summaryId ? {
        ...m,
        text: `**Conversation Summary**\n\n${summary}`,
        isStreaming: false
      } : m));

    } catch (error) {
      console.error("Chat summary error", error);
       setMessages(prev => prev.map(m => m.id === summaryId ? {
        ...m,
        text: "Sorry, I encountered an error while summarizing the chat.",
        isStreaming: false,
        isError: true
      } : m));
    } finally {
      setIsLoading(false);
      setTimeout(() => scrollToBottom(), 100);
    }
  };

  const toggleVoiceInput = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput((prev) => {
        const trimmed = prev.trim();
        return trimmed ? `${trimmed} ${transcript}` : transcript;
      });
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    
    const filePromises = fileArray.map(file => {
      return new Promise<Attachment | null>((resolve) => {
        const reader = new FileReader();
        
        reader.onload = () => {
          try {
            const result = reader.result as string;
            const base64Data = result.split(',')[1];
            const isImage = file.type.startsWith('image/');
            const isVideo = file.type.startsWith('video/');

            resolve({
              type: isImage ? 'image' : isVideo ? 'video' : 'file',
              mimeType: file.type,
              data: base64Data,
              name: file.name,
              url: result,
              size: file.size,
              lastModified: file.lastModified
            });
          } catch (e) {
            console.error("Error parsing file", file.name, e);
            resolve(null);
          }
        };

        reader.onerror = () => {
          resolve(null);
        };

        reader.readAsDataURL(file);
      });
    });

    try {
      const results = await Promise.all(filePromises);
      const newAttachments = results.filter((item): item is Attachment => item !== null);
      setAttachments(prev => [...prev, ...newAttachments]);
    } catch (error) {
      console.error("Error processing files:", error);
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSuggestionClick = (text: string, newMode: GenerationMode) => {
    setInput(text);
    setMode(newMode);
    setTimeout(() => handleSend(text, newMode), 0);
  };

  const handleStopGeneration = () => {
    abortControllerRef.current = true;
    setIsLoading(false);
    setMessages(prev => {
      const lastMsg = prev[prev.length - 1];
      if (lastMsg.role === 'model' && lastMsg.isStreaming) {
        return prev.map(msg => msg.id === lastMsg.id ? { ...msg, isStreaming: false, text: msg.text + " [Stopped]" } : msg);
      }
      return prev;
    });
  };

  const handleSend = async (manualInput?: string, manualMode?: GenerationMode) => {
    const textToSend = manualInput !== undefined ? manualInput : input;
    const modeToUse = manualMode !== undefined ? manualMode : mode;

    if ((!textToSend.trim() && attachments.length === 0) || isLoading) return;

    if (searchQuery) {
        setSearchQuery('');
        setIsSearchOpen(false);
    }

    abortControllerRef.current = false;
    const currentAttachments = [...attachments];
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      text: textToSend.trim(),
      timestamp: new Date(),
      attachments: currentAttachments.length > 0 ? currentAttachments : undefined
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setAttachments([]);
    setIsLoading(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      const botMessageId = crypto.randomUUID();
      setMessages(prev => [...prev, {
        id: botMessageId,
        role: 'model',
        text: '',
        timestamp: new Date(),
        isStreaming: true,
      }]);

      if (modeToUse === 'image') {
        const result = await generateImageContent(userMessage.text);
        if (abortControllerRef.current) return;
        
        setMessages(prev => prev.map(msg => 
          msg.id === botMessageId 
            ? { 
                ...msg, 
                text: result.text || 'Image generated successfully.', 
                attachments: result.attachments,
                isStreaming: false 
              } 
            : msg
        ));
      } 
      else if (modeToUse === 'video') {
         setMessages(prev => prev.map(msg => 
          msg.id === botMessageId 
            ? { ...msg, text: 'Generating video with Veo... This may take a minute.' } 
            : msg
         ));

         const result = await generateVideoContent(userMessage.text);
         if (abortControllerRef.current) return;

         setMessages(prev => prev.map(msg => 
          msg.id === botMessageId 
            ? { 
                ...msg, 
                text: result.text, 
                attachments: result.attachments,
                isStreaming: false 
              } 
            : msg
        ));
      }
      else {
        const modelName = modeToUse === 'code' ? 'gemini-3-pro-preview' : 'gemini-2.5-flash';
        const stream = await sendMessageStream(userMessage.text, currentAttachments, modelName);
        let fullText = '';
        
        for await (const chunk of stream) {
          if (abortControllerRef.current) {
            break;
          }
          const chunkText = (chunk as GenerateContentResponse).text;
          if (chunkText) {
            fullText += chunkText;
            setMessages(prev => prev.map(msg => 
              msg.id === botMessageId 
                ? { ...msg, text: fullText } 
                : msg
            ));
          }
        }
        
        setMessages(prev => prev.map(msg => 
          msg.id === botMessageId 
            ? { ...msg, isStreaming: false } 
            : msg
        ));
      }

    } catch (error: any) {
      if (abortControllerRef.current) return;
      console.error('Chat Error:', error);
      let errorMessage = "I encountered an error. Please try again.";
      if (error.message) {
         if (error.message.includes('API Key')) {
            errorMessage = "Missing API Key. Please add your API_KEY to the environment variables.";
         } else {
            errorMessage = error.message;
         }
      }

      setMessages(prev => {
         const lastMsg = prev[prev.length - 1];
         if (lastMsg.role === 'model') {
             return prev.map(msg => msg.id === lastMsg.id ? {
               ...msg, 
               isStreaming: false, 
               isError: true, 
               text: msg.text ? msg.text + `\n\n[Error: ${errorMessage}]` : errorMessage
              } : msg);
         }
         return [...prev];
      });
    } finally {
      if (!abortControllerRef.current) {
         setIsLoading(false);
         setTimeout(() => scrollToBottom(), 100);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const displayedMessages = searchQuery.trim() 
    ? messages.filter(m => m.text.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages;

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto w-full relative">
      
      <div className="sticky top-0 z-30 p-2 md:p-4 pb-0 bg-gradient-to-b from-slate-50 to-transparent dark:from-slate-950 dark:to-transparent pointer-events-none">
         <div className="flex justify-end pointer-events-auto">
            {isSearchOpen ? (
                <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full px-3 py-1.5 shadow-sm animate-fade-in w-full md:w-64">
                    <Search size={14} className="text-slate-400" />
                    <input 
                      type="text"
                      placeholder="Search messages..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-transparent border-none focus:ring-0 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 w-full"
                      autoFocus
                    />
                    <button 
                      onClick={() => {
                          setSearchQuery('');
                          setIsSearchOpen(false);
                      }}
                      className="text-slate-400 hover:text-red-500 transition-colors"
                    >
                        <X size={14} />
                    </button>
                </div>
            ) : (
                <button 
                  onClick={() => setIsSearchOpen(true)}
                  className="p-2 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur text-slate-500 hover:text-indigo-500 dark:hover:text-indigo-400 border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md"
                  title="Search chat"
                >
                    <Search size={18} />
                </button>
            )}
         </div>
      </div>

      <div 
        ref={chatContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 md:p-6 pt-2 scroll-smooth"
      >
        <div className="flex flex-col min-h-full justify-end">
          {messages.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center animate-fade-in p-4">
               <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-indigo-500/20 rotate-3 transform hover:rotate-6 transition-transform duration-300">
                  <Sparkles className="text-white w-10 h-10" />
               </div>
               <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">Welcome to JubitsGPT</h2>
               <p className="text-slate-500 dark:text-slate-400 text-center max-w-md mb-8">
                 Experience the power of multimodal AI. Generate code, images, videos, or just chat.
               </p>

               <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl">
                 {SUGGESTIONS.map((suggestion, index) => (
                   <button 
                     key={index}
                     onClick={() => handleSuggestionClick(suggestion.text, suggestion.mode)}
                     className="flex items-center gap-3 p-4 text-left bg-white dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/50 rounded-xl transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:shadow-indigo-500/5 group"
                   >
                     <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 dark:text-indigo-400 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/40 transition-colors">
                       {suggestion.icon}
                     </div>
                     <div>
                        <span className="block text-sm font-medium text-slate-700 dark:text-slate-200">{suggestion.text}</span>
                        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">{suggestion.mode}</span>
                     </div>
                   </button>
                 ))}
               </div>
            </div>
          )}

          {displayedMessages.length === 0 && searchQuery && (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400">
                  <p>No messages found for "{searchQuery}"</p>
              </div>
          )}

          {displayedMessages.map((msg) => (
            <MessageBubble 
              key={msg.id} 
              message={msg} 
              onSummarize={handleSummarizeMessage}
              highlight={searchQuery}
            />
          ))}

          {isLoading && messages[messages.length - 1]?.role !== 'model' && (
            <TypingIndicator />
          )}

          <div ref={messagesEndRef} className="h-4" />
        </div>
      </div>

      <div className="absolute bottom-32 right-6 flex flex-col gap-2 z-10 pointer-events-none">
        {showScrollBottom && (
          <button 
            onClick={() => scrollToBottom()}
            className="p-2 bg-white dark:bg-slate-800 text-indigo-500 dark:text-indigo-400 rounded-full shadow-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 pointer-events-auto transition-all animate-bounce-slow"
          >
            <ArrowDown size={20} />
          </button>
        )}
      </div>

      <div className="p-4 md:p-6 pt-0 bg-transparent relative z-20">
         <div className="flex justify-center mb-4">
            <div className="flex bg-slate-200/50 dark:bg-slate-800/50 p-1 rounded-full backdrop-blur-md border border-slate-200/50 dark:border-slate-700/50">
               <button 
                 onClick={() => setMode('chat')}
                 className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${mode === 'chat' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
               >
                 <MessageSquare size={14} /> Chat
               </button>
               <button 
                 onClick={() => setMode('code')}
                 className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${mode === 'code' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
               >
                 <Code size={14} /> Code
               </button>
               <button 
                 onClick={() => setMode('image')}
                 className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${mode === 'image' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
               >
                 <ImageIcon size={14} /> Nano Banana
               </button>
               <button 
                 onClick={() => setMode('video')}
                 className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${mode === 'video' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
               >
                 <VideoIcon size={14} /> Veo 3
               </button>
            </div>
         </div>

         <div className={`
           relative flex flex-col gap-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200 dark:border-slate-700/50 rounded-2xl p-2 shadow-xl shadow-slate-200/50 dark:shadow-none ring-1 ring-slate-900/5 dark:ring-white/5 transition-colors duration-300
           ${attachments.length > 0 ? 'rounded-tl-2xl rounded-tr-2xl' : ''}
         `}>
            
            {attachments.length > 0 && (
              <div className="flex gap-2 px-2 pb-2 overflow-x-auto">
                {attachments.map((att, index) => (
                  <div key={index} className="relative group shrink-0">
                    <div className="w-16 h-16 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      {att.type === 'image' ? (
                        <img src={att.url} alt="preview" className="w-full h-full object-cover" />
                      ) : att.type === 'video' ? (
                        <VideoIcon className="text-slate-400" />
                      ) : (
                        <FileText className="text-slate-400" />
                      )}
                    </div>
                    <button 
                      onClick={() => removeAttachment(index)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-red-600 transition-colors z-10"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {showPreview && input.trim() && (
               <div className="mx-2 mt-2 mb-2 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700/50 max-h-60 overflow-y-auto shadow-inner">
                  <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-200 dark:border-slate-700/50">
                     <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Preview</span>
                  </div>
                  <MarkdownRenderer content={input} />
               </div>
            )}

            <div className="flex items-end gap-2">
              <button 
                onClick={clearChat}
                className="p-3 text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors hidden sm:block"
                title="Clear conversation"
              >
                <Trash2 size={20} />
              </button>

              <button 
                onClick={handleExportChat}
                className="p-3 text-slate-400 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors hidden sm:block"
                title="Export Chat"
                disabled={messages.length === 0}
              >
                <Download size={20} />
              </button>

              <button 
                onClick={handleSummarizeChat}
                className="p-3 text-slate-400 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors hidden sm:block"
                title="Summarize conversation"
                disabled={isLoading || messages.length <= 1}
              >
                <ListPlus size={20} />
              </button>

              <button 
                onClick={() => setShowPreview(!showPreview)}
                className={`
                  p-3 rounded-xl transition-colors hidden sm:block
                  ${showPreview 
                    ? 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 dark:text-indigo-400' 
                    : 'text-slate-400 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-800'}
                `}
                title={showPreview ? "Hide preview" : "Show markdown preview"}
              >
                {showPreview ? <Eye size={20} /> : <EyeOff size={20} />}
              </button>
              
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileSelect}
                multiple
                accept="image/*,application/pdf,text/*,video/*"
                className="hidden"
              />
              
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-3 text-slate-400 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                title="Attach files"
              >
                <Paperclip size={20} />
              </button>

              {input.trim() && !isLoading && (
                 <button
                   onClick={handleEnhancePrompt}
                   disabled={isEnhancing}
                   className={`p-3 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-colors ${isEnhancing ? 'animate-pulse' : ''}`}
                   title="Enhance prompt with AI"
                 >
                   <Wand2 size={20} />
                 </button>
              )}

              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={mode === 'image' ? "Describe the image to generate..." : mode === 'video' ? "Describe the video to generate..." : "Ask anything..."}
                rows={1}
                className="flex-1 bg-transparent text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 border-none focus:ring-0 resize-none py-3 px-2 max-h-[120px] scrollbar-hide"
                style={{ minHeight: '44px' }}
              />

              {isSpeechSupported && (
                <button
                  onClick={toggleVoiceInput}
                  className={`
                    p-3 rounded-xl flex items-center justify-center transition-all duration-200
                    ${isListening 
                      ? 'bg-red-500/10 text-red-500 animate-pulse ring-1 ring-red-500/50' 
                      : 'text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800'}
                  `}
                  title={isListening ? "Stop recording" : "Use voice input"}
                >
                  {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                </button>
              )}

              {isLoading ? (
                 <button
                   onClick={handleStopGeneration}
                   className="p-3 rounded-xl flex items-center justify-center transition-all duration-200 bg-red-500 text-white shadow-lg hover:bg-red-600 animate-pulse"
                   title="Stop generating"
                 >
                   <StopCircle size={20} />
                 </button>
              ) : (
                <button
                  onClick={() => handleSend()}
                  disabled={(!input.trim() && attachments.length === 0)}
                  className={`
                    p-3 rounded-xl flex items-center justify-center transition-all duration-200
                    ${(input.trim() || attachments.length > 0)
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 hover:bg-indigo-500' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'}
                  `}
                >
                  <Send size={20} />
                </button>
              )}
            </div>
         </div>
         <div className="text-center mt-2">
            <p className="text-[10px] text-slate-500 dark:text-slate-600">
               JubitsGPT can make mistakes. Check important info.
            </p>
         </div>
      </div>
    </div>
  );
};

export default ChatInterface;

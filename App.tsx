import React, { useState, useEffect } from 'react';
import ChatInterface from './components/ChatInterface';
import ApiKeyModal from './components/ApiKeyModal';
import LoginScreen from './components/LoginScreen';
import { Menu, Sun, Moon, Facebook, Mail, Phone, MessageSquarePlus, History, Trash2, MessageSquare, Bot, Key, LogOut } from 'lucide-react';
import { ChatSession, Message } from './types';
import { getStoredApiKey } from './services/gemini';

// Robust ID generator that works in all environments (secure and non-secure)
const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    try {
      return crypto.randomUUID();
    } catch (e) {
      // Fallback if randomUUID fails
    }
  }
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

const App: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState<string | null>(null);

  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') || 'dark';
    }
    return 'dark';
  });

  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKeyVersion, setApiKeyVersion] = useState(0);

  // Initialize Theme and Check Auth
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);

    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
        setUser(storedUser);
    }
  }, [theme]);

  // Check for API key when user is logged in
  useEffect(() => {
    if (user) {
        const key = getStoredApiKey();
        if (!key) {
           setShowApiKeyModal(true);
        }
    }
  }, [user]);

  // Chat History State
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('chatSessions');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error("Failed to load chat history", e);
          return [];
        }
      }
    }
    return [];
  });

  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // Persist sessions
  useEffect(() => {
    localStorage.setItem('chatSessions', JSON.stringify(sessions));
  }, [sessions]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const handleLogin = (email: string) => {
      localStorage.setItem('currentUser', email);
      setUser(email);
  };

  const handleLogout = () => {
      localStorage.removeItem('currentUser');
      setUser(null);
      setIsSidebarOpen(false);
  };

  const createNewChat = () => {
    const newSession: ChatSession = {
      id: generateId(),
      title: 'New Chat',
      messages: [], 
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    if (window.innerWidth < 768) setIsSidebarOpen(false); 
  };

  const updateActiveSession = (messages: Message[]) => {
    if (!activeSessionId) return;

    setSessions(prev => prev.map(session => {
      if (session.id === activeSessionId) {
        let title = session.title;
        // Auto-title if it's new and has content
        if (session.title === 'New Chat' && messages.length > 0) {
          const firstUserMsg = messages.find(m => m.role === 'user');
          if (firstUserMsg) {
            title = firstUserMsg.text.slice(0, 30) + (firstUserMsg.text.length > 30 ? '...' : '');
          }
        }
        
        return {
          ...session,
          messages,
          title,
          updatedAt: Date.now()
        };
      }
      return session;
    }));
  };

  const deleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSessions(prev => prev.filter(s => s.id !== id));
    if (activeSessionId === id) {
      setActiveSessionId(null);
    }
  };

  // Ensure there is always a session if logged in
  useEffect(() => {
    if (user) {
        if (sessions.length === 0) {
          createNewChat();
        } else if (!activeSessionId) {
          setActiveSessionId(sessions[0].id);
        }
    }
  }, [user, sessions.length]);

  const activeSession = sessions.find(s => s.id === activeSessionId);

  // If not authenticated, show Login Screen
  if (!user) {
      return <LoginScreen onLogin={handleLogin} />;
  }

  // Authenticated Layout
  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 relative selection:bg-indigo-500/30 transition-colors duration-300 overflow-hidden">
      
      {/* Creative Background Elements */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute inset-0 z-0 bg-[length:400%_400%] bg-gradient-to-br from-indigo-100/30 via-purple-100/30 to-pink-100/30 dark:from-indigo-950/20 dark:via-purple-950/20 dark:to-pink-950/20 animate-gradient-xy opacity-60"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/3 w-96 h-96 bg-pink-500/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <ApiKeyModal 
        isOpen={showApiKeyModal} 
        onClose={() => setShowApiKeyModal(false)}
        onSave={() => {
          setShowApiKeyModal(false);
          // Increment version to force ChatInterface re-render and re-init with new key
          setApiKeyVersion(v => v + 1);
        }}
      />

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/20 dark:bg-black/60 z-20 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar (Desktop & Mobile) */}
      <aside 
        className={`
          fixed md:relative z-30 h-full w-72 
          bg-white/70 dark:bg-slate-900/50 
          border-r border-slate-200 dark:border-slate-800 
          backdrop-blur-xl
          transform transition-transform duration-300 ease-in-out flex flex-col
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <div className="p-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-200 dark:to-slate-200">
              JubitsGPT
            </h1>
          </div>
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-3">
          <button 
            onClick={createNewChat}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-500/30 transition-all active:scale-[0.98]"
          >
            <MessageSquarePlus size={18} />
            <span className="font-medium text-sm">New Chat</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-2 scrollbar-thin">
          {/* History Section */}
          <div className="mb-6">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-2 flex items-center gap-2">
              <History size={12} /> Recent History
            </div>
            <div className="space-y-1">
              {sessions.map((session) => (
                <div 
                  key={session.id}
                  onClick={() => {
                    setActiveSessionId(session.id);
                    if (window.innerWidth < 768) setIsSidebarOpen(false);
                  }}
                  className={`
                    group flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-colors border border-transparent
                    ${activeSessionId === session.id 
                      ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm' 
                      : 'hover:bg-slate-100/50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400'}
                  `}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <MessageSquare size={16} className={`shrink-0 ${activeSessionId === session.id ? 'text-indigo-500' : 'text-slate-400'}`} />
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-sm font-medium truncate dark:text-slate-200">
                        {session.title}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(session.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => deleteSession(e, session.id)}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md opacity-0 group-hover:opacity-100 transition-all"
                    title="Delete chat"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {sessions.length === 0 && (
                <div className="text-center py-4 text-xs text-slate-400 italic">
                  No chat history yet
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-800/50 my-4" />

          {/* About JUBIT Society Section */}
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 px-2">
            Contact Us
          </div>
          <div className="bg-slate-100/50 dark:bg-slate-800/30 rounded-xl p-4 border border-slate-200 dark:border-slate-700/30 backdrop-blur-sm mb-6 space-y-4">
             <a href="https://www.facebook.com/jubitsociety" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors group">
                <div className="p-1.5 rounded-md bg-slate-50 dark:bg-slate-800 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30 transition-colors shadow-sm">
                    <Facebook size={14} />
                </div>
                <span className="font-medium">Facebook Page</span>
            </a>
            <a href="mailto:juniorbcasitsociety@gmail.com" className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors group">
                 <div className="p-1.5 rounded-md bg-slate-50 dark:bg-slate-800 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30 transition-colors shadow-sm">
                    <Mail size={14} />
                </div>
                <span className="font-medium">Email Us</span>
            </a>
            <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400 group">
                 <div className="p-1.5 rounded-md bg-slate-50 dark:bg-slate-800 shadow-sm">
                    <Phone size={14} />
                </div>
                <span>+94 76 716 2395</span>
            </div>
          </div>

          {/* User Profile Section */}
          <div className="mb-4">
             <div className="bg-slate-100 dark:bg-slate-800/50 rounded-xl p-3 flex items-center gap-3 border border-slate-200 dark:border-slate-700/50">
                 <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {user?.charAt(0).toUpperCase()}
                 </div>
                 <div className="flex-1 overflow-hidden">
                     <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">{user}</p>
                     <p className="text-[10px] text-slate-500 dark:text-slate-400">Free Plan</p>
                 </div>
                 <button 
                   onClick={handleLogout}
                   className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                   title="Log Out"
                 >
                     <LogOut size={14} />
                 </button>
             </div>
          </div>

          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-2">
            Configuration
          </div>
          <button 
             onClick={() => setShowApiKeyModal(true)}
             className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors group"
          >
             <div className="p-1.5 rounded-md bg-slate-100 dark:bg-slate-700 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30 text-indigo-500 dark:text-indigo-400 transition-colors">
               <Key size={16} />
             </div>
             <span className="text-sm font-medium">Update API Key</span>
          </button>

        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800/50">
           <p className="text-xs text-center text-slate-500 dark:text-slate-600">
             Designed by <a href="https://mushieditz.vercel.app/" target="_blank" rel="noopener noreferrer" className="text-slate-600 dark:text-slate-500 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors">Mushi Editz</a>
           </p>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full relative w-full md:w-auto overflow-hidden transition-colors duration-300 z-10">
        {/* Mobile Header */}
        <div className="md:hidden h-14 border-b border-slate-200 dark:border-slate-800 flex items-center px-4 justify-between bg-white/70 dark:bg-slate-950/70 backdrop-blur-md z-10 sticky top-0">
          <div className="flex items-center gap-3">
             <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 -ml-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg active:bg-slate-100 dark:active:bg-slate-800 transition-colors"
             >
               <Menu className="w-6 h-6" />
             </button>
             <span className="font-semibold text-slate-800 dark:text-slate-200">JubitsGPT</span>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center">
               <Bot className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
            </div>
          </div>
        </div>

        <ChatInterface 
          key={`${activeSessionId}-${apiKeyVersion}`}
          initialMessages={activeSession?.messages || []}
          onUpdateMessages={updateActiveSession}
          onNewChat={createNewChat}
        />
        
      </main>
    </div>
  );
};

export default App;

import React from 'react';
import { Bot } from 'lucide-react';

const TypingIndicator: React.FC = () => {
  return (
    <div className="flex justify-start mb-6 animate-fade-in">
      <div className="flex max-w-[75%] gap-3">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-500/90 dark:bg-emerald-600/90 text-white flex items-center justify-center mt-1 shadow-md">
           <Bot size={16} />
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl rounded-tl-sm p-4 border border-slate-200 dark:border-slate-700/50 flex items-center gap-1.5 h-12 shadow-sm transition-colors duration-300 animate-pulse-fast">
          <div className="w-2.5 h-2.5 bg-indigo-500 dark:bg-indigo-400 rounded-full animate-typing [animation-delay:-0.32s]"></div>
          <div className="w-2.5 h-2.5 bg-indigo-500 dark:bg-indigo-400 rounded-full animate-typing [animation-delay:-0.16s]"></div>
          <div className="w-2.5 h-2.5 bg-indigo-500 dark:bg-indigo-400 rounded-full animate-typing"></div>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;
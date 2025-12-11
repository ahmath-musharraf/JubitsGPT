import React, { useState } from 'react';
import { Mail, Lock, ArrowRight, Bot, Sparkles, Loader2, Eye, EyeOff, User } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (email: string) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setIsLoading(true);
    // Simulate network request
    setTimeout(() => {
      onLogin(email);
      setIsLoading(false);
    }, 1500);
  };

  const handleGuestLogin = () => {
    onLogin('Guest');
  };

  const handleGoogleLogin = () => {
    setIsLoading(true);
    // Simulate Google OAuth redirect/response delay
    setTimeout(() => {
        onLogin('Google User');
        setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-300 font-sans selection:bg-indigo-500/30">
      
      {/* Background Elements */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute inset-0 z-0 bg-[length:400%_400%] bg-gradient-to-br from-indigo-100/30 via-purple-100/30 to-pink-100/30 dark:from-indigo-950/40 dark:via-purple-950/40 dark:to-pink-950/40 animate-gradient-xy opacity-100"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full filter blur-[100px]"></div>
      </div>

      <div className="relative z-10 w-full max-w-md p-6">
        <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/20 dark:border-slate-700/50 p-8 animate-fade-in overflow-hidden relative group">
            
            {/* Decorative top shimmer */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-80"></div>

            <div className="flex flex-col items-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-4 transform transition-transform group-hover:scale-110 duration-500">
                    <Bot className="w-9 h-9 text-white" />
                </div>
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-white dark:to-slate-300 text-center">
                    JubitsGPT
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 text-center">
                    {isSignUp ? "Create an account to get started" : "Welcome back! Please sign in."}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 ml-1">Email</label>
                    <div className="relative">
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                            <Mail size={18} />
                        </div>
                        <input 
                            type="email" 
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 ml-1">Password</label>
                    <div className="relative">
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                            <Lock size={18} />
                        </div>
                        <input 
                            type={showPassword ? "text" : "password"}
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full pl-10 pr-10 py-3 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                        />
                        <button 
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                        >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                     <label className="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors">
                        <input type="checkbox" className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:bg-slate-800 dark:border-slate-700" />
                        Remember me
                     </label>
                     <button type="button" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                        Forgot password?
                     </button>
                </div>

                <button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-xl font-medium shadow-lg shadow-indigo-500/25 transform transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 group/btn"
                >
                    {isLoading ? (
                        <Loader2 size={20} className="animate-spin" />
                    ) : (
                        <>
                           {isSignUp ? "Create Account" : "Sign In"}
                           <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                        </>
                    )}
                </button>
            </form>

            <div className="mt-4 flex items-center gap-4">
               <div className="h-px bg-slate-200 dark:bg-slate-700/50 flex-1"></div>
               <span className="text-xs text-slate-400 uppercase font-semibold">Or continue with</span>
               <div className="h-px bg-slate-200 dark:bg-slate-700/50 flex-1"></div>
            </div>

            <div className="mt-4 space-y-3">
               <button 
                 onClick={handleGoogleLogin}
                 disabled={isLoading}
                 className="w-full py-3 px-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl font-medium transition-colors flex items-center justify-center gap-3 text-sm relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
               >
                  {/* Google SVG Logo */}
                  <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  <span>Log in with Google</span>
               </button>

               <button 
                 onClick={handleGuestLogin}
                 disabled={isLoading}
                 className="w-full py-3 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
               >
                 <User size={16} />
                 Continue as Guest
               </button>
            </div>

            <div className="mt-6 text-center">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                    {isSignUp ? "Already have an account?" : "Don't have an account?"}
                    <button 
                        onClick={() => setIsSignUp(!isSignUp)}
                        className="ml-1.5 font-medium text-indigo-600 dark:text-indigo-400 hover:underline focus:outline-none"
                    >
                        {isSignUp ? "Sign In" : "Sign Up"}
                    </button>
                </p>
            </div>
            
            {/* Quick API Key note */}
            <div className="mt-8 pt-6 border-t border-slate-200/60 dark:border-slate-700/50 flex items-start gap-3">
                 <div className="p-2 bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-lg shrink-0">
                    <Sparkles size={16} />
                 </div>
                 <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Powered by Google Gemini. You will need a standard or free API Key.
                 </p>
            </div>
        </div>
        
        <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-6">
            &copy; {new Date().getFullYear()} Jubits Society. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default LoginScreen;

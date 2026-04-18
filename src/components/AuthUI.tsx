import React, { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { motion } from 'motion/react';
import { User, Lock, Mail, AlertCircle, CheckCircle2, UserCircle } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { MULTIPLAYER_SERVER } from '../game/constants';

import { Language, translations } from '../game/i18n';

interface AuthUIProps {
  onUsernameLogin?: (data: any) => void;
  language?: Language;
}

export const AuthUI: React.FC<AuthUIProps> = ({ onUsernameLogin, language = 'en' }) => {
  const t = translations[language];
  const [authMode, setAuthMode] = useState<'EMAIL' | 'USERNAME'>('EMAIL');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const socketUrl = window.location.hostname === 'localhost' || window.location.hostname.includes('run.app') 
      ? window.location.origin 
      : MULTIPLAYER_SERVER;
    const s = io(socketUrl);
    setSocket(s);
    return () => { s.disconnect(); };
  }, []);

  const handleUsernameLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !socket) return;
    
    setLoading(true);
    setError(null);
    
    socket.emit('login', username.trim(), (response: any) => {
      setLoading(false);
      if (response.success) {
        if (onUsernameLogin) onUsernameLogin(response.data);
      } else {
        setError(response.error || 'Failed to login with username');
      }
    });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      setMessage('Registration successful!');
    } catch (err: any) {
      setError(err.message || 'Failed to register');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email first');
      return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage('Password reset email sent!');
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-stone-950/95 flex items-center justify-center p-4 z-50 font-sans">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-stone-900 border-4 border-b-8 border-stone-700 rounded-3xl p-8 max-w-md w-full shadow-2xl"
      >
        <div className="text-center mb-6">
          <h2 className="text-4xl font-black text-amber-500 drop-shadow-[0_4px_0_rgb(180,83,9)] mb-1">
            {authMode === 'EMAIL' ? t.login : t.guestLogin}
          </h2>
          <p className="text-stone-400 font-bold uppercase text-sm">
            {authMode === 'EMAIL' ? 'Enter the battleground' : 'Join with a username'}
          </p>
        </div>

        <div className="flex gap-2 mb-6 bg-stone-950 p-1 rounded-xl border-2 border-stone-800">
          <button 
            onClick={() => setAuthMode('EMAIL')}
            className={`flex-1 py-2 rounded-lg font-black text-xs uppercase transition-all ${authMode === 'EMAIL' ? 'bg-stone-800 text-amber-500 shadow-lg' : 'text-stone-500 hover:text-stone-300'}`}
          >
            Email
          </button>
          <button 
            onClick={() => setAuthMode('USERNAME')}
            className={`flex-1 py-2 rounded-lg font-black text-xs uppercase transition-all ${authMode === 'USERNAME' ? 'bg-stone-800 text-amber-500 shadow-lg' : 'text-stone-500 hover:text-stone-300'}`}
          >
            {t.username}
          </button>
        </div>

        {error && (
          <div className="bg-red-500/20 border-2 border-red-500 text-red-400 p-3 rounded-xl mb-6 flex items-center gap-2 font-bold text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {message && (
          <div className="bg-green-500/20 border-2 border-green-500 text-green-400 p-3 rounded-xl mb-6 flex items-center gap-2 font-bold text-sm">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <p>{message}</p>
          </div>
        )}

        {authMode === 'EMAIL' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-stone-400 font-black mb-2 uppercase text-sm">{t.email}</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500 w-5 h-5" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-stone-950 border-2 border-stone-800 rounded-xl py-3 pl-12 pr-4 text-stone-100 font-bold focus:outline-none focus:border-amber-500 transition-colors"
                  placeholder="potato@survivor.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-stone-400 font-black mb-2 uppercase text-sm">{t.password}</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500 w-5 h-5" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-stone-950 border-2 border-stone-800 rounded-xl py-3 pl-12 pr-4 text-stone-100 font-bold focus:outline-none focus:border-amber-500 transition-colors"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div className="pt-4 flex flex-col gap-3">
              <button 
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-amber-500 text-stone-950 font-black text-xl rounded-2xl border-4 border-b-8 border-amber-700 hover:bg-amber-400 active:border-b-4 active:translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? t.processing : t.login}
              </button>
              
              <div className="grid grid-cols-2 gap-3">
                <button 
                  type="button"
                  onClick={handleRegister}
                  disabled={loading}
                  className="py-3 bg-stone-800 text-stone-100 font-black rounded-xl border-2 border-b-4 border-stone-950 hover:bg-stone-700 active:border-b-2 active:translate-y-1 transition-all disabled:opacity-50"
                >
                  {t.register}
                </button>
                <button 
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={loading}
                  className="py-3 bg-stone-800 text-stone-100 font-black rounded-xl border-2 border-b-4 border-stone-950 hover:bg-stone-700 active:border-b-2 active:translate-y-1 transition-all disabled:opacity-50 text-sm"
                >
                  {t.forgotPassword}
                </button>
              </div>
            </div>
          </form>
        ) : (
          <form onSubmit={handleUsernameLogin} className="space-y-4">
            <div>
              <label className="block text-stone-400 font-black mb-2 uppercase text-sm">{t.username}</label>
              <div className="relative">
                <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500 w-5 h-5" />
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-stone-950 border-2 border-stone-800 rounded-xl py-3 pl-12 pr-4 text-stone-100 font-bold focus:outline-none focus:border-amber-500 transition-colors"
                  placeholder="Enter your username"
                  required
                />
              </div>
            </div>

            <div className="pt-4">
              <button 
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-amber-500 text-stone-950 font-black text-xl rounded-2xl border-4 border-b-8 border-amber-700 hover:bg-amber-400 active:border-b-4 active:translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? t.loggingIn : t.startPlaying}
              </button>
              <p className="text-stone-500 text-[10px] font-bold text-center mt-4 uppercase">
                * Data will be saved to Firestore based on this username
              </p>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
};

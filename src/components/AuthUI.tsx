import React, { useState } from 'react';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { motion } from 'motion/react';
import { User, Lock, Mail, AlertCircle, CheckCircle2 } from 'lucide-react';

export const AuthUI: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

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
        <div className="text-center mb-8">
          <h2 className="text-5xl font-black text-amber-500 drop-shadow-[0_4px_0_rgb(180,83,9)] mb-2">
            LOGIN
          </h2>
          <p className="text-stone-400 font-bold uppercase">Enter the battleground</p>
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

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-stone-400 font-black mb-2 uppercase text-sm">Email</label>
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
            <label className="block text-stone-400 font-black mb-2 uppercase text-sm">Password</label>
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
              {loading ? 'PROCESSING...' : 'LOGIN'}
            </button>
            
            <div className="grid grid-cols-2 gap-3">
              <button 
                type="button"
                onClick={handleRegister}
                disabled={loading}
                className="py-3 bg-stone-800 text-stone-100 font-black rounded-xl border-2 border-b-4 border-stone-950 hover:bg-stone-700 active:border-b-2 active:translate-y-1 transition-all disabled:opacity-50"
              >
                REGISTER
              </button>
              <button 
                type="button"
                onClick={handleForgotPassword}
                disabled={loading}
                className="py-3 bg-stone-800 text-stone-100 font-black rounded-xl border-2 border-b-4 border-stone-950 hover:bg-stone-700 active:border-b-2 active:translate-y-1 transition-all disabled:opacity-50 text-sm"
              >
                FORGOT PWD?
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User, AlertCircle, CheckCircle2 } from 'lucide-react';
import { ref, get, set, remove } from 'firebase/database';
import { db, auth } from '../firebase';

interface DisplayNameModalProps {
  currentName: string | null;
  onClose?: () => void;
  forced?: boolean;
}

export const DisplayNameModal: React.FC<DisplayNameModalProps> = ({ currentName, onClose, forced }) => {
  const [name, setName] = useState(currentName || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Display name cannot be empty');
      return;
    }
    if (trimmed.length < 3 || trimmed.length > 15) {
      setError('Display name must be between 3 and 15 characters');
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
      setError('Only letters, numbers, and underscores allowed');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error('Not authenticated');

      const lowerNew = trimmed.toLowerCase();
      const lowerOld = currentName ? currentName.toLowerCase() : null;

      if (lowerNew !== lowerOld) {
        const nameRef = ref(db, `usernames/${lowerNew}`);
        const snapshot = await get(nameRef);
        
        if (snapshot.exists() && snapshot.val() !== uid) {
          throw new Error('This name is already taken. Please choose another.');
        }

        // Save new name
        await set(nameRef, uid);
        await set(ref(db, `users/${uid}/profile/displayName`), trimmed);

        // Remove old name
        if (lowerOld) {
          await remove(ref(db, `usernames/${lowerOld}`));
        }
      }

      setSuccess(true);
      setTimeout(() => {
        if (onClose) onClose();
      }, 1000);

    } catch (err: any) {
      setError(err.message || 'Failed to update display name');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-stone-950/95 flex items-center justify-center p-4 z-[60] font-sans">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-stone-900 border-4 border-b-8 border-stone-700 rounded-3xl p-8 max-w-md w-full shadow-2xl"
      >
        <div className="text-center mb-8">
          <h2 className="text-4xl font-black text-amber-500 drop-shadow-[0_4px_0_rgb(180,83,9)] mb-2 uppercase">
            {forced ? 'Set Display Name' : 'Change Name'}
          </h2>
          <p className="text-stone-400 font-bold uppercase">
            {forced ? 'How should we call you?' : 'Enter your new display name'}
          </p>
        </div>

        {error && (
          <div className="bg-red-500/20 border-2 border-red-500 text-red-400 p-3 rounded-xl mb-6 flex items-center gap-2 font-bold text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-500/20 border-2 border-green-500 text-green-400 p-3 rounded-xl mb-6 flex items-center gap-2 font-bold text-sm">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <p>Display name updated successfully!</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500 w-5 h-5" />
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-stone-950 border-2 border-stone-800 rounded-xl py-3 pl-12 pr-4 text-stone-100 font-bold focus:outline-none focus:border-amber-500 transition-colors"
                placeholder="e.g. PotatoKing99"
                required
                maxLength={15}
              />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button 
              type="submit"
              disabled={loading || success}
              className="w-full py-4 bg-amber-500 text-stone-950 font-black text-xl rounded-2xl border-4 border-b-8 border-amber-700 hover:bg-amber-400 active:border-b-4 active:translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'CHECKING...' : 'SAVE NAME'}
            </button>
            
            {!forced && (
              <button 
                type="button"
                onClick={onClose}
                disabled={loading}
                className="py-3 bg-stone-800 text-stone-100 font-black rounded-xl border-2 border-b-4 border-stone-950 hover:bg-stone-700 active:border-b-2 active:translate-y-1 transition-all disabled:opacity-50"
              >
                CANCEL
              </button>
            )}
          </div>
        </form>
      </motion.div>
    </div>
  );
};

'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Lock, Mail, User as UserIcon, LogIn, UserPlus } from 'lucide-react';
import { UserProfile } from '@/types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [mounted, setMounted] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll when modal is active
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
    const body = isRegister ? { email, username, password } : { email, password };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      onSuccess(data.user);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = () => {
    setEmail('user@webify.audio');
    setPassword('password123');
    setIsRegister(false);
  };

  const modalContent = (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-xl overflow-y-auto flex items-center justify-center p-4 py-8 animate-fadeIn select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass-panel border border-white/10 rounded-3xl w-full max-w-md p-6 sm:p-8 space-y-5 shadow-2xl relative my-auto max-h-[92vh] overflow-y-auto"
      >
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-4 right-4 p-2 rounded-full glass-pill text-white/60 hover:text-white transition-all z-10"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-2xl glass-pill text-obsidian-accent mx-auto flex items-center justify-center mb-2 shadow-md">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="text-2xl font-bold tracking-tight text-white">
            {isRegister ? 'Create an Account' : 'Log In to Webify'}
          </h3>
          <p className="text-xs text-white/50">
            {isRegister
              ? 'Join Webify Hi-Fi streaming community.'
              : 'Log in to sync your favorites, playlists, and DSP EQ settings.'}
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-white/70 uppercase tracking-wider block">
                Username
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-white/40 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  autoFocus
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Audiophile"
                  className="w-full glass-pill rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/30"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-mono text-white/70 uppercase tracking-wider block">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-white/40 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@webify.audio"
                className="w-full glass-pill rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/30"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono text-white/70 uppercase tracking-wider block">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-white/40 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full glass-pill rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/30"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-white text-black text-sm font-semibold hover:bg-white/90 active:scale-95 transition-all shadow-xl flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
          >
            {isRegister ? (
              <>
                <UserPlus className="w-4 h-4 text-black" />
                <span>{loading ? 'Creating Account...' : 'Create Account'}</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4 text-black" />
                <span>{loading ? 'Logging In...' : 'Log In'}</span>
              </>
            )}
          </button>
        </form>

        <div className="flex items-center justify-between text-xs pt-3 border-t border-white/[0.06]">
          <button
            onClick={fillDemo}
            className="text-obsidian-accent hover:underline font-mono text-[11px]"
          >
            Fill Demo Account
          </button>

          <button
            onClick={() => {
              setIsRegister(!isRegister);
              setError(null);
            }}
            className="text-white/60 hover:text-white transition-colors"
          >
            {isRegister ? 'Already have an account? Log in' : "Don't have an account? Sign up"}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

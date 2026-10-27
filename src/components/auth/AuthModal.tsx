'use client';

import React, { useState } from 'react';
import { X, Lock, Mail, User as UserIcon, LogIn, UserPlus } from 'lucide-react';
import { UserProfile } from '@/types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

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
    setEmail('user@obsidian.audio');
    setPassword('password123');
    setIsRegister(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-obsidian-card border border-obsidian-border rounded-2xl w-full max-w-md p-6 sm:p-8 space-y-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-obsidian-secondary hover:text-obsidian-primary hover:bg-obsidian-hover transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-1">
          <div className="w-10 h-10 rounded-xl bg-obsidian-accent/15 border border-obsidian-accent/30 text-obsidian-accent mx-auto flex items-center justify-center mb-3">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="text-xl font-bold tracking-tightest text-obsidian-primary">
            {isRegister ? 'Create an Obsidian Account' : 'Welcome to Obsidian'}
          </h3>
          <p className="text-xs text-obsidian-secondary">
            {isRegister
              ? 'Join our high-fidelity audiophile community.'
              : 'Sign in to sync your EQ, telemetry, and custom playlists.'}
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-obsidian-secondary uppercase tracking-wider">
                Username
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-obsidian-secondary absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Audiophile"
                  className="w-full bg-obsidian-sidebar border border-obsidian-border focus:border-obsidian-accent rounded-lg pl-9 pr-4 py-2 text-sm text-obsidian-primary placeholder:text-obsidian-secondary/50 outline-none"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-mono text-obsidian-secondary uppercase tracking-wider">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-obsidian-secondary absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@obsidian.audio"
                className="w-full bg-obsidian-sidebar border border-obsidian-border focus:border-obsidian-accent rounded-lg pl-9 pr-4 py-2 text-sm text-obsidian-primary placeholder:text-obsidian-secondary/50 outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono text-obsidian-secondary uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-obsidian-secondary absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-obsidian-sidebar border border-obsidian-border focus:border-obsidian-accent rounded-lg pl-9 pr-4 py-2 text-sm text-obsidian-primary placeholder:text-obsidian-secondary/50 outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-obsidian-accent hover:bg-obsidian-accent-hover text-white text-sm font-semibold transition-all shadow-md flex items-center justify-center gap-2 mt-2"
          >
            {isRegister ? (
              <>
                <UserPlus className="w-4 h-4" />
                <span>{loading ? 'Creating Account...' : 'Sign Up'}</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>{loading ? 'Signing In...' : 'Sign In'}</span>
              </>
            )}
          </button>
        </form>

        <div className="flex items-center justify-between text-xs pt-2 border-t border-obsidian-border">
          <button
            onClick={fillDemo}
            className="text-obsidian-accent hover:underline font-mono"
          >
            Fill Demo Account
          </button>

          <button
            onClick={() => {
              setIsRegister(!isRegister);
              setError(null);
            }}
            className="text-obsidian-secondary hover:text-obsidian-primary"
          >
            {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        </div>
      </div>
    </div>
  );
};

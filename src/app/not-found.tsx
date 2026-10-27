import Link from 'next/link';
import { Disc3, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-obsidian-card border border-obsidian-border flex items-center justify-center text-obsidian-accent mb-6 shadow-xl">
        <Disc3 className="w-8 h-8 animate-spin-slow" />
      </div>
      <h1 className="text-3xl font-extrabold text-obsidian-primary tracking-tightest mb-2">
        404 - Track or Page Not Found
      </h1>
      <p className="text-sm text-obsidian-secondary max-w-md mb-8">
        The frequency you are searching for has faded into the noise. Let&apos;s get you back to the session.
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-obsidian-accent hover:bg-obsidian-accent-hover text-white text-sm font-semibold transition-all shadow-lg"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Dashboard</span>
      </Link>
    </div>
  );
}


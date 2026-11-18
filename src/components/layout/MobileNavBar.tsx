'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Library, Heart, Download } from 'lucide-react';

export const MobileNavBar: React.FC = () => {
  const pathname = usePathname();

  const tabs = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Search', href: '/search', icon: Search },
    { label: 'Library', href: '/library', icon: Library },
    { label: 'Favorites', href: '/favorites', icon: Heart },
    { label: 'Import', href: '/import', icon: Download },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 h-14 bg-surface-base/95 backdrop-blur-2xl border-t border-white/[0.08] z-40 flex items-center justify-around px-2 select-none shadow-[0_-4px_24px_rgba(0,0,0,0.5)]">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = pathname === tab.href || (tab.href !== '/' && pathname.startsWith(tab.href));

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-full transition-all duration-200 ${
              isActive
                ? 'text-brand-primary font-bold bg-brand-primary/10 border border-brand-primary/20'
                : 'text-content-muted hover:text-white'
            }`}
          >
            <Icon className="w-4 h-4 mb-0.5" />
            <span className="text-[10px] tracking-tight">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};


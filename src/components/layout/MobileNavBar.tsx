'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Library, Sliders, Download } from 'lucide-react';

export const MobileNavBar: React.FC = () => {
  const pathname = usePathname();

  const tabs = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Search', href: '/search', icon: Search },
    { label: 'Library', href: '/library', icon: Library },
    { label: 'Import', href: '/import', icon: Download },
    { label: 'EQ', href: '/settings', icon: Sliders },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 h-14 bg-obsidian-sidebar/95 backdrop-blur-xl border-t border-obsidian-border z-40 flex items-center justify-around px-2 select-none shadow-2xl">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = pathname === tab.href || (tab.href !== '/' && pathname.startsWith(tab.href));

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex flex-col items-center justify-center w-14 py-1 rounded-lg transition-colors ${
              isActive
                ? 'text-obsidian-accent font-semibold'
                : 'text-obsidian-secondary hover:text-obsidian-primary'
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


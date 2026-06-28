// src/components/ui/ThemeToggle.tsx
'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';

export function ThemeToggle() {
  const { theme, toggleTheme, mounted } = useTheme();

  if (!mounted) return <div className="w-9 h-9 bg-bg-tertiary rounded-lg animate-pulse" />;

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        'relative p-2 rounded-lg transition-colors',
        'hover:bg-bg-hover text-text-secondary hover:text-text-primary'
      )}
      aria-label="Toggle theme"
    >
      <div className="relative w-5 h-5">
        <Sun
          className={cn(
            'absolute inset-0 transition-all duration-300 transform',
            theme === 'dark' 
              ? 'rotate-90 scale-0 opacity-0' 
              : 'rotate-0 scale-100 opacity-100'
          )}
        />
        <Moon
          className={cn(
            'absolute inset-0 transition-all duration-300 transform',
            theme === 'dark' 
              ? 'rotate-0 scale-100 opacity-100' 
              : '-rotate-90 scale-0 opacity-0'
          )}
        />
      </div>
    </button>
  );
}
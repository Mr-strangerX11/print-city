'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="w-8 h-8" />;

  const options = [
    { value: 'light', icon: Sun, label: 'Light' },
    { value: 'dark',  icon: Moon, label: 'Dark' },
    { value: 'system', icon: Monitor, label: 'System' },
  ] as const;

  const current = options.find(o => o.value === theme) ?? options[2];
  const Icon = current.icon;

  const cycle = () => {
    const idx = options.findIndex(o => o.value === theme);
    setTheme(options[(idx + 1) % options.length].value);
  };

  return (
    <button
      onClick={cycle}
      title={`Theme: ${current.label}`}
      className={cn(
        'p-2 rounded-xl transition-colors',
        'text-[var(--text-body)] hover:text-[var(--text-heading)] hover:bg-[var(--hover-bg)]',
        className,
      )}
      aria-label="Toggle theme"
    >
      <Icon className="w-4 h-4" />
    </button>
  );
}

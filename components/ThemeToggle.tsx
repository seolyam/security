"use client"

import React from 'react';
import { Button } from './ui/button';
import { Sun, Moon, Monitor, Palette } from 'lucide-react';
import { useTheme, type Theme } from '../lib/themeProvider';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const themes: Array<{ value: Theme; label: string; icon: typeof Sun }> = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor }
  ];

  return (
    <div className="flex items-center gap-1">
      <Palette className="h-4 w-4 text-gray-500 dark:text-gray-400" />
      <div className="flex rounded-md border border-gray-200 dark:border-gray-700">
        {themes.map((themeOption) => {
          const Icon = themeOption.icon;
          const isActive = theme === themeOption.value;

          return (
            <Button
              key={themeOption.value}
              variant="ghost"
              size="sm"
              onClick={() => setTheme(themeOption.value)}
              className={`h-8 px-2 text-xs border-0 rounded-none first:rounded-l-md last:rounded-r-md ${
                isActive
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
              title={`Switch to ${themeOption.label} theme`}
            >
              <Icon className="h-3 w-3" />
            </Button>
          );
        })}
      </div>
    </div>
  );
}

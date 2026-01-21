import React, { createContext, useState, useEffect } from 'react';

const darkColors = {
  background: '#0A0A0A',       // Obsidian
  card: '#1A1F36',             // Deep Navy
  border: '#2C2C2C',           // Charcoal
  textMain: '#F5F5F5',         // Cloud White
  textMuted: '#A0A0A0',        // Slate Gray
  textSecondary: '#888888',
  textTertiary: '#666666',
  primary: '#00A86B',          // Finance Green
  accent: '#F4C430',           // Warm Gold
  profit: '#22C55E',
  expense: '#EF4444',
  debt: '#F59E0B',
  yango: { yellow: '#FBBF24' },
  bolt: { green: '#10B981' },
};

const lightColors = {
  background: '#F5F5F5',       // Cloud White
  card: '#FFFFFF',             // Pure White
  border: '#D0D0D0',           // Light Graphite
  textMain: '#1A1F36',         // Deep Navy
  textMuted: '#4A4A4A',        // Slate Gray
  textSecondary: '#666666',
  textTertiary: '#888888',
  primary: '#00A86B',          // Finance Green
  accent: '#F4C430',           // Warm Gold
  profit: '#22C55E',
  expense: '#EF4444',
  debt: '#F59E0B',
  yango: { yellow: '#FBBF24' },
  bolt: { green: '#10B981' },
};

export const ThemeContext = createContext({ theme: 'dark', colors: darkColors });

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    const checkTheme = () => {
      const now = new Date();
      const hour = now.getHours();
      const minute = now.getMinutes();
      const isDark =
        (hour > 17 || hour < 6) ||
        (hour === 17 && minute >= 30) ||
        (hour === 6 && minute < 30);
      setTheme(isDark ? 'dark' : 'light');
    };
    checkTheme();
    const interval = setInterval(checkTheme, 60000); // check every minute
    return () => clearInterval(interval);
  }, []);

  const colors = theme === 'dark' ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ theme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

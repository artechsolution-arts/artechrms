import { useState, useEffect } from 'react';

export const ACCENT_THEMES = [
  { name: 'blue',   hex: '#2E6BE6', dark: '#1B3A6B', label: 'Blue' },
  { name: 'purple', hex: '#7C3AED', dark: '#4C1D95', label: 'Purple' },
  { name: 'green',  hex: '#059669', dark: '#065F46', label: 'Green' },
  { name: 'rose',   hex: '#E11D48', dark: '#9F1239', label: 'Rose' },
  { name: 'indigo', hex: '#4F46E5', dark: '#312E81', label: 'Indigo' },
];

export function useTheme() {
  const [accent, setAccentState] = useState(
    () => localStorage.getItem('hrms_accent') || 'blue'
  );
  const [darkMode, setDarkModeState] = useState(
    () => localStorage.getItem('hrms_dark') === 'true'
  );

  useEffect(() => {
    const t = ACCENT_THEMES.find(t => t.name === accent) || ACCENT_THEMES[0];
    document.documentElement.style.setProperty('--accent', t.hex);
    document.documentElement.style.setProperty('--accent-dark', t.dark);
    document.documentElement.setAttribute('data-accent', accent);
  }, [accent]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  const setAccent = name => {
    setAccentState(name);
    localStorage.setItem('hrms_accent', name);
  };

  const setDarkMode = val => {
    setDarkModeState(val);
    localStorage.setItem('hrms_dark', String(val));
  };

  return { accent, setAccent, darkMode, setDarkMode };
}

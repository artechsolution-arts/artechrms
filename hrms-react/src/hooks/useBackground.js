import { useState, useEffect } from 'react';

// Background themes — selecting one changes the whole app's backdrop + accent + mode
export const BACKGROUNDS = [
  {
    key: 'faded-lightheme', label: 'Soft Light', sub: 'Artech office',
    file: 'faded-lightheme.jpg', thumb: 'faded-lightheme-thumb.jpg',
    accent: '#2E6BE6', accentDark: '#1B3A6B', dark: false,
    overlay: 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(240,246,255,0.14) 100%)',
  },
  {
    key: 'darktheme-2', label: 'Deep Dark', sub: 'Tech night',
    file: 'darktheme-2.png', thumb: 'darktheme-2-thumb.png',
    accent: '#6366F1', accentDark: '#312E81', dark: true,
    overlay: 'linear-gradient(180deg, rgba(8,10,24,0.50) 0%, rgba(6,8,20,0.68) 100%)',
  },
];

export function applyBackground(key, { syncMode = true } = {}) {
  const bg = BACKGROUNDS.find(b => b.key === key) || BACKGROUNDS[0];
  const root = document.documentElement;
  if (!bg.file) {
    root.classList.remove('has-bg-image');
    root.style.removeProperty('--app-bg-image');
    root.style.removeProperty('--bg-overlay');
  } else {
    root.classList.add('has-bg-image');
    root.style.setProperty('--app-bg-image', `url(/themes/${bg.file})`);
    root.style.setProperty('--bg-overlay', bg.overlay);
  }
  // Tag the active theme key on <html> so CSS can apply per-theme overrides
  root.setAttribute('data-theme', bg.key);
  // Mark whether the active backdrop is dark — drives glass/text styling
  // independently of the light/dark mode toggle.
  root.classList.toggle('bg-is-dark', !!bg.file && !!bg.dark);
  // Accent follows the image
  root.style.setProperty('--accent', bg.accent);
  root.style.setProperty('--accent-dark', bg.accentDark);
  // Light/dark mode follows the image (only on explicit selection)
  if (syncMode) {
    root.classList.toggle('dark', bg.dark);
    localStorage.setItem('hrms_dark', String(bg.dark));
  }
}

export function useBackground() {
  const [background, setBackgroundState] = useState(() => {
    const saved = localStorage.getItem('hrms_bg');
    // Fall back to first theme if saved key is no longer in the list
    return saved && BACKGROUNDS.find(b => b.key === saved) ? saved : BACKGROUNDS[0].key;
  });

  // Re-apply on mount (without forcing mode — respect the saved dark setting)
  useEffect(() => {
    applyBackground(background, { syncMode: false });
  }, []); // eslint-disable-line

  const setBackground = (key) => {
    setBackgroundState(key);
    localStorage.setItem('hrms_bg', key);
    applyBackground(key, { syncMode: true });
  };

  return { background, setBackground };
}

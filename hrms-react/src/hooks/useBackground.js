import { useState, useEffect } from 'react';

// Background themes — selecting one changes the whole app's backdrop + accent + mode
export const BACKGROUNDS = [
  {
    key: 'none', label: 'Default', sub: 'Artech sky',
    file: 'default-bg.jpg', thumb: 'default-bg-thumb.jpg',
    accent: '#3D9BE6', accentDark: '#1A6AB4', dark: true,
    overlay: 'linear-gradient(180deg, rgba(8,16,32,0.60) 0%, rgba(6,12,24,0.78) 100%)',
  },
  {
    key: 'nebula', label: 'Nebula', sub: 'Cosmic ink',
    file: 'nebula.jpg', thumb: 'nebula-thumb.jpg',
    accent: '#F59E0B', accentDark: '#7C3AED', dark: true,
    overlay: 'linear-gradient(180deg, rgba(10,6,20,0.55) 0%, rgba(10,6,20,0.72) 100%)',
  },
  {
    key: 'aurora', label: 'Aurora', sub: 'Light streaks',
    file: 'aurora.jpg', thumb: 'aurora-thumb.jpg',
    accent: '#6366F1', accentDark: '#312E81', dark: true,
    overlay: 'linear-gradient(180deg, rgba(8,10,40,0.55) 0%, rgba(8,10,40,0.74) 100%)',
  },
  {
    key: 'monochrome', label: 'Monochrome', sub: 'Architecture',
    file: 'monochrome.jpg', thumb: 'monochrome-thumb.jpg',
    accent: '#60A5FA', accentDark: '#1E3A8A', dark: true,
    overlay: 'linear-gradient(180deg, rgba(10,13,20,0.62) 0%, rgba(8,10,16,0.80) 100%)',
  },
  {
    key: 'canyon', label: 'Canyon', sub: 'Antelope rock',
    file: 'canyon.jpg', thumb: 'canyon-thumb.jpg',
    accent: '#F59E0B', accentDark: '#7C3A00', dark: true,
    overlay: 'linear-gradient(180deg, rgba(28,14,6,0.58) 0%, rgba(18,9,4,0.78) 100%)',
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
  const [background, setBackgroundState] = useState(
    () => localStorage.getItem('hrms_bg') || 'none'
  );

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

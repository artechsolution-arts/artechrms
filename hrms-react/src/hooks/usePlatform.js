import { useState, useEffect } from 'react';

export function usePlatform() {
  const [isNative,  setIsNative]  = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.Capacitor?.isNativePlatform?.()) setIsNative(true);
    else if ('__TAURI_INTERNALS__' in window)    setIsDesktop(true);
  }, []);

  return {
    isNative,   // true on Android + iOS apps
    isDesktop,  // true on Windows + macOS apps
    isWeb: !isNative && !isDesktop,  // true on browser
    isMobile: isNative,
  };
}

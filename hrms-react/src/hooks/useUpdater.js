import { useEffect } from 'react';

export function useUpdater(toast) {
  useEffect(() => {
    // Only runs inside Tauri desktop app
    if (!('__TAURI_INTERNALS__' in window)) return;

    async function checkUpdate() {
      try {
        // Use Function constructor to bypass Vite's static import analysis in dev mode
        const dynImport = new Function('m', 'return import(m)');
        const { check } = await dynImport('@tauri-apps/plugin-updater');
        const { relaunch } = await dynImport('@tauri-apps/plugin-process');

        const update = await check();
        if (!update) return;

        toast(`Update available: v${update.version}. Downloading...`, 'info');

        await update.downloadAndInstall();

        toast('Update installed — restarting...', 'success');
        setTimeout(() => relaunch(), 1500);
      } catch {
        // Silent — update check failure should never interrupt the user
      }
    }

    // Check 3 seconds after launch so it doesn't block startup
    const t = setTimeout(checkUpdate, 3000);
    return () => clearTimeout(t);
  }, []);
}

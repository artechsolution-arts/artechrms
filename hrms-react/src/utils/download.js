/**
 * Cross-platform authenticated file download.
 *
 * Web browser: creates a temporary <a> blob URL and clicks it (standard approach).
 * Tauri desktop: same approach works — Tauri's webview supports blob downloads.
 * Capacitor iOS/Android: blob clicks fail silently on iOS WebKit; we write the file
 *   to the device's Downloads/Documents folder via the Filesystem API instead.
 *
 * Usage:
 *   import { downloadAuthFile } from '../utils/download';
 *   await downloadAuthFile('/api/payroll/slip/42/pdf', 'payslip-june.pdf');
 */

export async function downloadAuthFile(url, filename) {
  const token = localStorage.getItem('artech_hrms_token');
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);

  const blob = await res.blob();

  // Capacitor iOS/Android: blob URL clicks don't trigger downloads
  if (typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.()) {
    await saveFileNative(blob, filename);
    return;
  }

  // Web + Tauri: standard blob URL download
  saveBlobWeb(blob, filename);
}

function saveBlobWeb(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

async function saveFileNative(blob, filename) {
  // Use Function constructor to bypass Vite's static import analysis entirely.
  // These packages only exist on native Capacitor builds — never called on web/desktop.
  const dynImport = new Function('m', 'return import(m)');
  const { Filesystem, Directory } = await dynImport('@capacitor/filesystem');
  const { Share } = await dynImport('@capacitor/share');

  // Convert blob to base64
  const base64 = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

  const result = await Filesystem.writeFile({
    path: filename,
    data: base64,
    directory: Directory.Cache,
  });

  // Open the share sheet so the user can save/open it
  await Share.share({
    title: filename,
    url: result.uri,
  });
}

/** Convenience: download a public (no auth) URL */
export async function downloadFile(url, filename) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  saveBlobWeb(await res.blob(), filename);
}

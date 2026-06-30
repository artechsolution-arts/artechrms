import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Hide Capacitor splash screen after React mounts
if ('Capacitor' in window) {
  const dynImport = new Function('m', 'return import(m)');
  dynImport('@capacitor/splash-screen').then(({ SplashScreen }) => {
    SplashScreen.hide({ fadeOutDuration: 300 });
  }).catch(() => {});
}

import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.artech.hrms',
  appName: 'AR Peopliz',
  // Points to the same folder vite.config.js builds into — no vite change needed
  webDir: '../frontend',

  server: {
    androidScheme: 'https',
    // Uncomment for live-reload on a physical device during development:
    // url: 'http://192.168.1.100:3000',
    // cleartext: true,
  },

  android: {
    backgroundColor: '#ffffff',
    allowMixedContent: false,
    webContentsDebuggingEnabled: false,
  },

  ios: {
    backgroundColor: '#ffffff',
    contentInset: 'automatic',
    scrollEnabled: true,
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: true,
      backgroundColor: '#2563EB',
      showSpinner: false,
    },
    StatusBar: {
      style: 'Default',
      backgroundColor: '#2563EB',
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
  },
};

export default config;

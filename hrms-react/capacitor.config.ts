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
    backgroundColor: '#EEF3FC',
    allowMixedContent: false,
    webContentsDebuggingEnabled: false,
  },

  ios: {
    backgroundColor: '#EEF3FC',
    contentInset: 'automatic',
    scrollEnabled: true,
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: '#EEF3FC',
      showSpinner: false,
    },
    StatusBar: {
      style: 'Default',
      backgroundColor: '#ffffff',
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
  },
};

export default config;

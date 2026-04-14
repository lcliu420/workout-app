import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: process.env.CAP_APP_ID ?? 'com.personal.fitnessapp',
  appName: process.env.CAP_APP_NAME ?? 'Fitness App',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;

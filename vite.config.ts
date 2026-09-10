import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import { googleAdsAgentPlugin } from './server/googleAds';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      plugins: [googleAdsAgentPlugin(env)],
      server: {
        host: '0.0.0.0',
        allowedHosts: true,
      },
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});

import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
// ??1. ?啣?嚗???PWA 憭?
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  
  const env = loadEnv(mode, '.', '');
  return {
    // ???耨?寥ㄐ?irebase ?函蔡?冽?桅?嚗?隞亥??孵? '/'
    base: '/',

    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    
    // ??2. 靽格嚗 plugins ???銝剖???VitePWA 閮剖?
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'favicon.svg'],
        manifest: {
          name: 'CloudLedger ?脰?',
          short_name: 'CloudLedger',
          description: '?函??脩垢?箸閮董?拇?',
          theme_color: '#ffffff',
          background_color: '#000000ff',
          display: 'standalone', // 霈?璈?蝬脩??嗆? App ??????          scope: '/',
          start_url: '/',
          icons: [
            {
              src: 'web-app-manifest-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any maskable'
            },
            {
              src: 'web-app-manifest-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        }
      })
    ],

    // ?? ?酉嚗??AI ?摩撌脩?蝘餃敺垢嚗?蝡臬撖虫???閬? KEY 鈭?    // 雿鈭?憭芸??梯正?梢嚗挾??????
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    build: {
      outDir: 'dist',
    },
    test: {
      environment: 'jsdom',
      setupFiles: ['./vitest.setup.ts'],
      environmentMatchGlobs: [
        ['functions/test/**', 'node']
      ]
    }
  };
});

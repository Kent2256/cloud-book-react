import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    // 👇【修改這裡】Firebase 部署在根目錄，所以要改回 '/'
    base: '/',

    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    // ⚠️ 備註：既然 AI 邏輯已經移到後端，前端其實不再需要這些 KEY 了
    // 但為了避免改太多東西報錯，這段先留著沒關係
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
    }
  };
});
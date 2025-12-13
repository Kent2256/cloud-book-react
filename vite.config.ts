import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    // 👇【新增】關鍵設定：你的 GitHub Repository 名稱
    // 如果你的專案名稱不是 cloud-book-react，請自行修改這裡
    base: '/cloud-book-react/',

    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    // 👇【新增】指定打包輸出目錄 (對應 deploy.yml 的設定)
    build: {
      outDir: 'dist',
    }
  };
});
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir:   'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup:      resolve(__dirname, 'popup.html'),
        content:    resolve(__dirname, 'src/content/content.js'),
        background: resolve(__dirname, 'src/background/service-worker.js'),
      },
      output: {
        // Keep content + background at root of dist (manifest references them directly)
        entryFileNames: (chunk) =>
          ['content', 'background'].includes(chunk.name)
            ? '[name].js'
            : 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },
  // Make sure content script doesn't pull in React chunks
  define: {
    'process.env.NODE_ENV': '"production"',
  },
});

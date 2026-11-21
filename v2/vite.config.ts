import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

export default defineConfig({
  plugins: [preact()],
  base: './',
  build: {
    target: 'es2022',
    minify: 'esbuild',
    cssMinify: true,
    sourcemap: false,
    cssCodeSplit: true,
    assetsInlineLimit: 1024,
    reportCompressedSize: false,
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/preact')) return 'ui-core';
          if (id.includes('node_modules/firebase')) return 'firebase';
        }
      }
    }
  },
  server: { port: 1420, strictPort: true }
});

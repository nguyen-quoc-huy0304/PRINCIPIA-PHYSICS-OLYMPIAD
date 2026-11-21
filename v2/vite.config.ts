import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

export default defineConfig({
  plugins: [preact()],
  base: './',
  publicDir: '../assets/images',
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
          // Firebase is intentionally left to Rollup's dynamic-import splitting:
          // auth and Firestore must not be downloaded during the initial app boot.
        }
      }
    }
  },
  server: { port: 1420, strictPort: true }
});

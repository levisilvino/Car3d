import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  root: 'src',
  publicDir: '../public',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: '/index.html',
        sequence: '/sequence.html'
      }
    }
  },
  server: {
    port: 3000,
    open: true
  }
});
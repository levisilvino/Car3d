import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  root: 'src',
  base: '/',  // Importante para o Vercel
  publicDir: '../public',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: '/index.html',
        sequence: '/sequence.html'
      }
    },
    // Garante que os assets são copiados corretamente
    assetsDir: 'assets',
    copyPublicDir: true
  },
  server: {
    port: 3000
  }
});
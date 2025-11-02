import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true
  },
  publicDir: 'public',
  server: {
    port: 3000
  }
});
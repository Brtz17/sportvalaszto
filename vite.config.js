import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist'
  },
  publicDir: 'public',  // CSAK a public mappát másolja
  server: {
    port: 3000
  }
});
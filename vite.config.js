import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        login: resolve(__dirname, 'login.html'),
        profile: resolve(__dirname, 'profile.html'),
        signup: resolve(__dirname, 'signup.html'),
        csapat: resolve(__dirname, 'csapat.html')
      },
      external: ['appwrite'] // Ez megakadályozza, hogy bundle-olja
    }
  },
  publicDir: 'public',
  server: {
    port: 3000
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './'),
      '@js': resolve(__dirname, './js'),
      '@styles': resolve(__dirname, './style'),
      '@lib': resolve(__dirname, './js/lib')
    }
  }
});
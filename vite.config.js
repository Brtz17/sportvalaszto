import { defineConfig } from 'vite';
import { resolve } from 'path';
import { copyFileSync, existsSync, mkdirSync } from 'fs';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        form: resolve(__dirname, 'form.html')
      }
    },
    // Üres outDir, mert mi manuálisan másolunk
    outDir: 'dist',
  },
  publicDir: 'public',
  server: {
    port: 3000
  },
  plugins: [
    {
      name: 'copy-essential-files',
      closeBundle() {
        // Biztosítjuk, hogy a dist mappa létezik
        if (!existsSync('dist')) {
          mkdirSync('dist');
        }

        // Fontos fájlok listája amiket másolni kell
        const filesToCopy = [
          { from: 'src/lib/appwrite.js', to: 'dist/lib/appwrite.js' },
          { from: 'style/index.css', to: 'dist/style/index.css' },
          { from: 'style/form.css', to: 'dist/style/form.css' },
          { from: 'public/form.html', to: 'dist/form.html' },
          { from: 'public/form.css', to: 'dist/form.css' },
          { from: 'images', to: 'dist/images' }
        ];

        filesToCopy.forEach(file => {
          try {
            if (file.from.includes('images') && existsSync('images')) {
              // Mappa másolása
              this.copyDir('images', 'dist/images');
            } else if (existsSync(file.from)) {
              // Fájl másolása
              this.ensureDirExists(file.to);
              copyFileSync(file.from, file.to);
              console.log(`✅ Másolva: ${file.from} -> ${file.to}`);
            } else {
              console.log(`⚠️  Nem található: ${file.from}`);
            }
          } catch (error) {
            console.error(`❌ Hiba másolás közben: ${file.from}`, error);
          }
        });
      },

      // Segédfüggvény mappa létrehozásához
      ensureDirExists(filePath) {
        const dir = filePath.includes('/') ? filePath.substring(0, filePath.lastIndexOf('/')) : '';
        if (dir && !existsSync(dir)) {
          mkdirSync(dir, { recursive: true });
        }
      },

      // Segédfüggvény mappa másolásához
      copyDir(src, dest) {
        if (!existsSync(dest)) {
          mkdirSync(dest, { recursive: true });
        }
        // Egyszerű mappa másolás - csak a fájlokat másolja
        if (existsSync(src)) {
          const fs = require('fs');
          const path = require('path');
          
          const items = fs.readdirSync(src);
          items.forEach(item => {
            const srcPath = path.join(src, item);
            const destPath = path.join(dest, item);
            
            if (fs.statSync(srcPath).isDirectory()) {
              this.copyDir(srcPath, destPath);
            } else {
              fs.copyFileSync(srcPath, destPath);
            }
          });
        }
      }
    }
  ]
});
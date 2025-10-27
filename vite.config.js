import { defineConfig } from 'vite';
import { resolve } from 'path';
import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Segédfüggvények
function ensureDirExists(filePath) {
  const dir = filePath.includes('/') ? filePath.substring(0, filePath.lastIndexOf('/')) : '';
  if (dir && !existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

function copyDir(src, dest) {
  if (!existsSync(dest)) {
    mkdirSync(dest, { recursive: true });
  }
  
  if (existsSync(src)) {
    const items = readdirSync(src);
    items.forEach(item => {
      const srcPath = resolve(src, item);
      const destPath = resolve(dest, item);
      
      if (statSync(srcPath).isDirectory()) {
        copyDir(srcPath, destPath);
      } else {
        copyFileSync(srcPath, destPath);
      }
    });
  }
}

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        form: resolve(__dirname, 'form.html')
      }
    },
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
        console.log('📁 Fontos fájlok másolása...');
        
        // Fontos fájlok listája
        const filesToCopy = [
          { from: 'src/lib/appwrite.js', to: 'dist/lib/appwrite.js' },
          { from: 'style/index.css', to: 'dist/style/index.css' },
          { from: 'style/form.css', to: 'dist/style/form.css' }
        ];

        filesToCopy.forEach(file => {
          try {
            if (existsSync(file.from)) {
              ensureDirExists(file.to);
              copyFileSync(file.from, file.to);
              console.log(`✅ Másolva: ${file.from} -> ${file.to}`);
            } else {
              console.log(`⚠️  Nem található: ${file.from}`);
            }
          } catch (error) {
            console.error(`❌ Hiba másolás közben: ${file.from}`, error);
          }
        });

        // Images mappa másolása
        if (existsSync('images')) {
          try {
            copyDir('images', 'dist/images');
            console.log('✅ Images mappa másolva');
          } catch (error) {
            console.error('❌ Hiba images mappa másolásakor:', error);
          }
        }
      }
    }
  ]
});
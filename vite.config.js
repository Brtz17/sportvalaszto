import { defineConfig } from 'vite';
import { resolve } from 'path';
import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

function copyFileIfExists(src, dest) {
  if (existsSync(src)) {
    try {
      const destDir = dest.substring(0, dest.lastIndexOf('/'));
      if (!existsSync(destDir)) {
        mkdirSync(destDir, { recursive: true });
      }
      copyFileSync(src, dest);
      console.log(`✅ Másolva: ${src} -> ${dest}`);
    } catch (error) {
      console.error(`❌ Hiba: ${src}`, error);
    }
  }
}

function copyDir(src, dest) {
  if (!existsSync(src)) return;
  
  if (!existsSync(dest)) {
    mkdirSync(dest, { recursive: true });
  }
  
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

export default defineConfig({
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        login: resolve(__dirname, 'login.html'),
        signup: resolve(__dirname, 'signup.html'),
        profile: resolve(__dirname, 'profile.html')
      }
    }
  },
  publicDir: 'public',
  server: {
    port: 3000
  },
  plugins: [
    {
      name: 'copy-html-files',
      closeBundle() {
        console.log('📄 HTML fájlok másolása...');
        
        // Másold az összes HTML fájlt
        const htmlFiles = ['index.html', 'login.html', 'signup.html', 'profile.html'];
        htmlFiles.forEach(file => {
          copyFileIfExists(resolve(__dirname, file), resolve(__dirname, 'dist', file));
        });

        // Másold a public mappát
        if (existsSync('public')) {
          console.log('📁 Public mappa másolása...');
          copyDir('public', 'dist/public');
        }

        console.log('✅ Minden fájl másolva!');
      }
    }
  ]
});
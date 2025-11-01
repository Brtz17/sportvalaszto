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
  if (!existsSync(src)) {
    console.log(`⚠️  Forrás mappa nem létezik: ${src}`);
    return;
  }
  
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
      try {
        copyFileSync(srcPath, destPath);
        console.log(`✅ Másolva: ${srcPath} -> ${destPath}`);
      } catch (error) {
        console.error(`❌ Hiba másolás közben: ${srcPath}`, error);
      }
    }
  });
}

function copyFileIfExists(src, dest) {
  if (existsSync(src)) {
    try {
      ensureDirExists(dest);
      copyFileSync(src, dest);
      console.log(`✅ Másolva: ${src} -> ${dest}`);
      return true;
    } catch (error) {
      console.error(`❌ Hiba másolás közben: ${src}`, error);
    }
  } else {
    console.log(`⚠️  Nem található: ${src}`);
  }
  return false;
}

export default defineConfig({
  root: __dirname,
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
    port: 3000,
    open: true
  },
  plugins: [
    {
      name: 'copy-essential-files',
      closeBundle() {
        console.log('🚀 Fontos fájlok másolása...');
        
        // HTML fájlok
        const htmlFiles = ['index.html', 'login.html', 'signup.html', 'profile.html'];
        htmlFiles.forEach(file => {
          copyFileIfExists(resolve(__dirname, file), resolve(__dirname, 'dist', file));
        });

        // JavaScript fájlok
        const jsFiles = [
          'src/index.js',
          'src/login.js',
          'src/signup.js', 
          'src/profile.js',
          'src/lib/appwrite.js'
        ];
        
        jsFiles.forEach(file => {
          const destFile = file.replace('src/', '');
          copyFileIfExists(resolve(__dirname, file), resolve(__dirname, 'dist', destFile));
        });

        // CSS fájlok
        copyFileIfExists(resolve(__dirname, 'style/index.css'), resolve(__dirname, 'dist/style/index.css'));

        // Mappák
        if (existsSync('public')) {
          console.log('📁 Public mappa másolása...');
          copyDir('public', 'dist');
        }

        if (existsSync('images')) {
          console.log('🖼️  Images mappa másolása...');
          copyDir('images', 'dist/images');
        }

        // Dokumentáció
        copyFileIfExists(resolve(__dirname, 'README.md'), resolve(__dirname, 'dist/README.md'));
        copyFileIfExists(resolve(__dirname, 'LICENSE'), resolve(__dirname, 'dist/LICENSE'));

        console.log('🎉 Build kész! A dist mappa készen áll a GitHub Pages-re.');
      }
    }
  ]
});
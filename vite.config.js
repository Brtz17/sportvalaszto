import { defineConfig } from 'vite'
import fs from 'fs'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'

// Public mappa másolása
function copyPublicToDist() {
  const publicDir = 'public'
  const distDir = 'dist'
  
  if (!fs.existsSync(publicDir)) {
    console.warn('Public mappa nem található')
    return
  }
  
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true })
  }
  
  function copyRecursive(source, target) {
    if (fs.statSync(source).isDirectory()) {
      if (!fs.existsSync(target)) {
        fs.mkdirSync(target, { recursive: true })
      }
      const files = fs.readdirSync(source)
      files.forEach(file => {
        copyRecursive(path.join(source, file), path.join(target, file))
      })
    } else {
      fs.copyFileSync(source, target)
    }
  }
  
  copyRecursive(publicDir, distDir)
  console.log('✅ Public mappa másolva a dist mappába')
}

// Semmi.html törlése
function deleteSemmiHtml() {
  const semmiHtmlPath = path.join('dist', 'semmi.html')
  if (fs.existsSync(semmiHtmlPath)) {
    fs.unlinkSync(semmiHtmlPath)
    console.log('🗑️ semmi.html törölve')
  }
}

export default defineConfig({
  base: '/', // Fontos GitHub Pages-hez
  plugins: [
    tailwindcss(), // Tailwind CSS integráció
    {
      name: 'copy-and-cleanup',
      buildStart() {
        copyPublicToDist()
      },
      closeBundle() {
        deleteSemmiHtml()
        console.log('🚀 Build kész! Készen áll a GitHub Pages deploy-ra.')
      }
    }
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: false
  }
})
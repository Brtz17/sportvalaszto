import { defineConfig } from 'vite'
import fs from 'fs'
import path from 'path'

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true
  },
  publicDir: 'public',
  plugins: [
    {
      name: 'cleanup-semmi-html',
      closeBundle() {
        // Várj egy kicsit, hogy biztosan befejeződött a másolás
        setTimeout(() => {
          const semmiHtmlPath = path.join('dist', 'semmi.html')
          if (fs.existsSync(semmiHtmlPath)) {
            fs.unlinkSync(semmiHtmlPath)
            console.log('✅ semmi.html fájl törölve a dist mappából')
          }
        }, 100)
      }
    }
  ]
})
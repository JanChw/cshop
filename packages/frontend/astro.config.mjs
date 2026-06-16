import { defineConfig } from 'astro/config'
import solid from '@astrojs/solid-js'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  integrations: [solid()],
  vite: {
    plugins: [tailwindcss()],
    server: {
      proxy: {
        '/api/v1': {
          target: 'http://localhost:3001',
          changeOrigin: true
        }
      }
    }
  }
})

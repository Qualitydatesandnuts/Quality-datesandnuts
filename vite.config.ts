import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': 'http://localhost:4000',
    },
    watch: {
      // Runtime-written files (DB, uploaded images, seed artifacts) must not
      // trigger dev-server page reloads for shoppers browsing the site.
      ignored: [
        '**/server/**',
        '**/public/product/uploads/**',
        '**/public/product/reviews/**',
        '**/public/product/gen/**',
        '**/public/sitemap.xml',
        '**/public/robots.txt',
        '**/public/llms.txt',
      ],
    },
  },
})

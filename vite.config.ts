import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [vue()],
  server: {
    port: 5173,
    strictPort: true,
  },
  test: {
    environment: 'happy-dom',
    include: ['src/**/*.{test,spec}.ts'],
  },
})

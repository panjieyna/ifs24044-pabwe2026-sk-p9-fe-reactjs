import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const port = Number(env.VITE_PORT) || 5174
  // Saat pengembangan, request relatif /api diteruskan ke backend Golang (port 8081).
  const proxy = {
    '/api': {
      target: env.VITE_PROXY_TARGET || 'http://localhost:8081',
      changeOrigin: true,
    },
  }

  return {
    plugins: [react(), tailwindcss()],
    server: { port, proxy },
    preview: { port, proxy },
    build: {
      target: 'es2020',
      cssCodeSplit: true,
      chunkSizeWarningLimit: 900,
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/setupTests.js',
      css: false,
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html', 'lcov'],
        include: ['src/**/*.{js,jsx}'],
        exclude: ['src/main.jsx', 'src/setupTests.js', 'src/test/**', '**/*.test.{js,jsx}'],
        thresholds: {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
      },
    },
  }
})

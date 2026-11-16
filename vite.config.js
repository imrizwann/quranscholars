import { defineConfig, loadEnv } from 'vite'
import process from 'node:process'
import { validatePublicEnvironment } from './scripts/public-environment.mjs'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  if (command === 'build') {
    // A build in a custom mode must still exclude development pages and tools.
    if (process.env.NODE_ENV !== 'production' || (process.env.VITE_USER_NODE_ENV && process.env.VITE_USER_NODE_ENV !== 'production')) {
      throw new Error('Frontend builds require NODE_ENV=production');
    }
    validatePublicEnvironment(env);
  }
  return {
    plugins: [react(), tailwindcss()],
    // Worktrees can share node_modules, but must not overwrite each other's optimized dependencies.
    cacheDir: fileURLToPath(new URL('./.vite', import.meta.url)),
    resolve: {
      dedupe: ['react', 'react-dom'],
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      port: 3001,
      strictPort: true
    }
  }
})

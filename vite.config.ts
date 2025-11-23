import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const normalizeBasePath = (path: string | undefined) => {
  if (!path) return '/'
  const trimmed = path.replace(/^\/+/, '').replace(/\/+$/, '')
  return trimmed ? `/${trimmed}/` : '/'
}

// https://vite.dev/config/
export default defineConfig({
  // Keep Pages deploys working across repo renames and custom domains.
  base: normalizeBasePath(
    process.env.VITE_BASE_PATH ||
      (process.env.GITHUB_REPOSITORY
        ? `/${process.env.GITHUB_REPOSITORY.split('/')[1]}/`
        : '/')
  ),
  plugins: [react()],
})

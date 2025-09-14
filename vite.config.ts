// vite.config.ts — Gestor Maruê (React + Vite)
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Deploy em subpasta: https://www.brquest.com.br/gestor-marue/
// A base PRECISA ser "/gestor-marue/" para que os assets carreguem no servidor
export default defineConfig({
  base: '/gestor-marue/',
  plugins: [react()],
  build: {
    outDir: 'dist',      // saída do build
    target: 'es2020',    // JS alvo (bom suporte nos navegadores atuais)
    sourcemap: false,
    emptyOutDir: true,
  },
})

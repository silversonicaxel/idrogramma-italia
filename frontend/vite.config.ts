import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // i JSON generati dalla pipeline (frontend/static/data) sono serviti in /data
  // e copiati nel build — stesso percorso su tutti i branch dei framework
  publicDir: 'static',
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        dati: 'dati.html',
      },
    },
  },
});

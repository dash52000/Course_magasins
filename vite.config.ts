import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  // Chemins relatifs : l'app fonctionne sous n'importe quel sous-dossier (GitHub Pages).
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Panier',
        short_name: 'Panier',
        description: 'Notre liste de courses partagée',
        lang: 'fr',
        start_url: './',
        scope: './',
        display: 'standalone',
        background_color: '#E9F5EC',
        theme_color: '#E9F5EC',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        navigateFallback: 'index.html',
        // Les données viennent toujours de Supabase : on ne met en cache que l'app elle-même.
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
      },
    }),
  ],
  test: {
    include: ['src/**/*.test.ts'],
  },
});

/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { VitePWA } from 'vite-plugin-pwa';

// Servida en https://mariocesar.github.io/mathwizard/ — dev usa la misma base
// para que las rutas nunca diverjan entre local y producción.
const BASE = '/mathwizard/';

export default defineConfig({
  base: BASE,
  plugins: [
    svelte(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Matemago',
        short_name: 'Matemago',
        description: 'Conviértete en un mago de las mates practicando.',
        lang: 'es',
        start_url: BASE,
        scope: BASE,
        display: 'standalone',
        display_override: ['fullscreen', 'standalone'],
        orientation: 'portrait',
        theme_color: '#faf5ec',
        background_color: '#faf5ec',
        icons: [
          { src: 'icons/pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/pwa-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,mp3}'],
        navigateFallback: `${BASE}index.html`,
      },
    }),
  ],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});

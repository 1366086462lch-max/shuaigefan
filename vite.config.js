import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: '甩个饭 · 摇一摇决定吃什么',
        short_name: '甩个饭',
        description: '附近随机餐厅推荐，告别选择困难',
        theme_color: '#f97316',
        background_color: '#fff7ed',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        lang: 'zh-CN',
        icons: [
          {
            src: 'icon.svg',
            sizes: '192x192 512x512 any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        runtimeCaching: [
          {
            // 高德 Web 服务接口：网络优先，失败用缓存
            urlPattern: /^https:\/\/restapi\.amap\.com\/.*/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'amap-api-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 30 },
              networkTimeoutSeconds: 5,
            },
          },
          {
            // 高德 JS API：缓存优先（变更频率低）
            urlPattern: /^https:\/\/webapi\.amap\.com\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'amap-sdk-cache',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 7 },
            },
          },
        ],
      },
    }),
  ],
  server: {
    host: true,
    port: 5173,
  },
});

import { defineConfig } from 'vite';

export default defineConfig({
  build: { chunkSizeWarningLimit: 900 }, // three.js is most of the bundle
});

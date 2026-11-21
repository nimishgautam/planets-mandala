import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // relative asset paths so the build works under GitHub Pages' /<repo>/ subpath
  build: { chunkSizeWarningLimit: 900 }, // three.js is most of the bundle
});

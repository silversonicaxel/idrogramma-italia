import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    // sito 100% statico: tutte le pagine prerenderizzate, deployabile
    // su Cloudflare Pages / GitHub Pages / qualsiasi http server
    adapter: adapter(),
  },
};

export default config;

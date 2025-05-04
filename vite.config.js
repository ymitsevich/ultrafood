import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
    plugins: [
        svelte({
            hot: false, // Disable HMR for Svelte components
            compilerOptions: {
                dev: false // Disable development mode features
            }
        })
    ],
    base: '/ultrafood/', // Base path for GitHub Pages
    server: {
        port: 3123,
        host: '0.0.0.0',
        strictPort: true,
        hmr: false // Disable HMR globally
    },
    build: {
        outDir: 'dist',
        emptyOutDir: true
    }
});

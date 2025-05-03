import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

export default {
    // Consult https://svelte.dev/docs#compile-time-svelte-preprocess
    // for more information about preprocessors
    preprocess: vitePreprocess(),
    
    // Disable platform-specific rollup binaries to avoid the error
    // with @rollup/rollup-darwin-arm64
    onwarn: (warning, handler) => {
        // Suppress warnings about missing optional dependencies
        if (warning.code === 'MISSING_OPTIONAL_DEPENDENCY') return;
        handler(warning);
    }
};
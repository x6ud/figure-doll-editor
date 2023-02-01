import vue from '@vitejs/plugin-vue';
import {defineConfig} from 'vite';

export default defineConfig({
    base: './',
    build: {
        minify: 'esbuild',
        sourcemap: true
    },
    esbuild: {
        keepNames: true
    },
    server: {
        https: true
    },
    plugins: [
        vue()
    ]
});

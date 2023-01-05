import vue from '@vitejs/plugin-vue';
import {defineConfig} from 'vite';

export default defineConfig({
    base: './',
    server: {
        https: true
    },
    plugins: [
        vue()
    ]
});

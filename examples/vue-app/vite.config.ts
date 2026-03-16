import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import designerMode from '@designer-mode/vite-plugin';

export default defineConfig({
  plugins: [
    vue(),
    designerMode({ framework: 'vue' }),
  ],
});

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import designerMode from 'vite-plugin-designer-mode';

export default defineConfig({
  plugins: [
    vue(),
    designerMode({ framework: 'vue' }),
  ],
});

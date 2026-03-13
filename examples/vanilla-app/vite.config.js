import { defineConfig } from 'vite';
import designerMode from 'vite-plugin-designer-mode';

export default defineConfig({
  plugins: [
    designerMode({ framework: 'vanilla' }),
  ],
});

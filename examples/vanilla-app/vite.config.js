import { defineConfig } from 'vite';
import designerMode from '@designer-mode/vite-plugin';

export default defineConfig({
  plugins: [
    designerMode({ framework: 'vanilla' }),
  ],
});

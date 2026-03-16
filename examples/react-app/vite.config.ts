import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import designerMode from '@designer-mode/vite-plugin';

export default defineConfig({
  plugins: [
    react(),
    designerMode({ framework: 'react' }),
  ],
});

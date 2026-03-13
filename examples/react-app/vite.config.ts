import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import designerMode from 'vite-plugin-designer-mode';

export default defineConfig({
  plugins: [
    react(),
    designerMode({ framework: 'react' }),
  ],
});

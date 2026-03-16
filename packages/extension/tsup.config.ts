import { defineConfig } from 'tsup';
import path from 'node:path';

const alias = {
  '@designer-mode/core': path.resolve(__dirname, '../core/src/index.ts'),
};

export default defineConfig([
  {
    entry: {
      content: 'src/content.ts',
      background: 'src/background.ts',
    },
    format: ['iife'],
    outDir: 'dist',
    globalName: 'DesignerModeExt',
    sourcemap: false,
    clean: true,
    noExternal: [/.*/], // Bundle everything for extension
    esbuildOptions(options) {
      options.alias = alias;
      options.outExtension = { '.js': '.js' };
    },
  },
  {
    entry: {
      'popup/popup': 'src/popup/popup.ts',
      'options/options': 'src/options/options.ts',
    },
    format: ['iife'],
    outDir: 'dist',
    globalName: 'DesignerModePopup',
    sourcemap: false,
    noExternal: [/.*/],
    esbuildOptions(options) {
      options.alias = alias;
      options.outExtension = { '.js': '.js' };
    },
  },
]);

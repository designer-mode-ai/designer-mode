const { cpSync, mkdirSync } = require('node:fs');
const { resolve } = require('node:path');

const root = resolve(__dirname, '..');
const dist = resolve(root, 'dist');

// Copy manifest
cpSync(resolve(root, 'manifest.json'), resolve(dist, 'manifest.json'));

// Copy icons
mkdirSync(resolve(dist, 'icons'), { recursive: true });
cpSync(resolve(root, 'icons'), resolve(dist, 'icons'), { recursive: true });

// Copy popup and options HTML/CSS
for (const dir of ['popup', 'options']) {
  const srcDir = resolve(root, 'src', dir);
  const destDir = resolve(dist, dir);
  mkdirSync(destDir, { recursive: true });
  for (const ext of ['.html', '.css']) {
    try {
      cpSync(resolve(srcDir, `${dir}${ext}`), resolve(destDir, `${dir}${ext}`));
    } catch {}
  }
}

console.log('[copy-assets] Assets copied to dist/');

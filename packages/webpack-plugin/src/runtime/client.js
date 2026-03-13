// Injected by DesignerModeWebpackPlugin in dev mode
// This file is meant to be bundled into the app
if (process.env.NODE_ENV !== 'production') {
  import('designer-mode').then(({ initDesignerMode }) => {
    const port = process.env.DESIGNER_PORT || '3334';
    const host = process.env.DESIGNER_HOST || '127.0.0.1';
    initDesignerMode({ relayUrl: `http://${host}:${port}` });
  }).catch(err => {
    console.warn('[designer-mode] Failed to initialize:', err);
  });
}

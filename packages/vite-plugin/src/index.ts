import type { Plugin, ViteDevServer } from 'vite';
import { spawn } from 'node:child_process';

export interface DesignerModePluginOptions {
  /** Port for the relay server. Default: 3334 */
  port?: number;
  /** Host for the relay server. Default: 127.0.0.1 */
  host?: string;
  /** Which framework adapter to inject. Default: 'auto' */
  framework?: 'auto' | 'react' | 'vue' | 'svelte' | 'angular' | 'vanilla';
  /** Whether to add file path annotations to components. Default: true */
  annotations?: boolean;
}

const VIRTUAL_MODULE_ID = 'virtual:designer-mode';
const RESOLVED_VIRTUAL_MODULE_ID = '\0' + VIRTUAL_MODULE_ID;

function getClientCode(framework: string, port: number, host: string): string {
  const relayUrl = `http://${host}:${port}`;
  return `
import { initDesignerMode } from 'designer-mode/${framework === 'auto' ? '' : framework}';

if (import.meta.hot) {
  initDesignerMode({ relayUrl: '${relayUrl}' }).then(cleanup => {
    import.meta.hot.dispose(() => cleanup());
  });
}
`;
}

export default function designerModePlugin(options: DesignerModePluginOptions = {}): Plugin {
  const {
    port = 3334,
    host = '127.0.0.1',
    framework = 'auto',
    annotations = true,
  } = options;

  let server: ViteDevServer | undefined;

  return {
    name: '@designer-mode/vite-plugin',
    apply: 'serve', // only in dev mode

    configureServer(s) {
      server = s;
      // Auto-start relay server
      server.httpServer?.once('listening', () => {
        const env = { ...process.env, DESIGNER_PORT: String(port), DESIGNER_HOST: host };
        try {
          // Start in background — non-blocking
          const child = spawn('node', ['-e', "require('@designer-mode/server').createServer().listen(process.env.DESIGNER_PORT || 3334)"], {
            env,
            stdio: 'ignore',
            detached: true,
          });
          child.unref();
        } catch {
          // Server may already be running, ignore
        }
      });
    },

    resolveId(id) {
      if (id === VIRTUAL_MODULE_ID) return RESOLVED_VIRTUAL_MODULE_ID;
    },

    load(id) {
      if (id === RESOLVED_VIRTUAL_MODULE_ID) {
        return getClientCode(framework, port, host);
      }
    },

    transform(code, id, transformOptions) {
      // Only in dev mode, skip node_modules
      if (!annotations || id.includes('node_modules')) return;
      if (transformOptions?.ssr) return;

      // React: inject _debugSource-equivalent data attributes via JSX transform
      // This is done at the framework level; the plugin just enables it
      // by setting the appropriate environment variables

      // Vue SFC: handled by vue-loader/vite-plugin-vue natively in dev mode
      // Svelte: handled by @designer-mode/inspector-svelte preprocessor

      return null;
    },

    transformIndexHtml(html) {
      // Inject the virtual module import into the HTML in dev mode
      // Use Vite's /@id/ prefix so the browser routes the request through Vite's dev server
      return {
        html,
        tags: [
          {
            tag: 'script',
            attrs: { type: 'module', src: `/@id/${VIRTUAL_MODULE_ID}` },
            injectTo: 'body',
          },
        ],
      };
    },
  };
}

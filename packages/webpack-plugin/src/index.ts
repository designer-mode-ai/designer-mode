import type { Compiler, WebpackPluginInstance } from 'webpack';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export interface DesignerModeWebpackPluginOptions {
  /** Port for the relay server. Default: 3334 */
  port?: number;
  /** Host for the relay server. Default: 127.0.0.1 */
  host?: string;
  /** Which framework adapter to inject. Default: 'auto' */
  framework?: 'auto' | 'react' | 'vue' | 'svelte' | 'angular' | 'vanilla';
}

const PLUGIN_NAME = 'DesignerModeWebpackPlugin';

export class DesignerModeWebpackPlugin implements WebpackPluginInstance {
  private options: Required<DesignerModeWebpackPluginOptions>;
  private serverProcess: ReturnType<typeof spawn> | null = null;

  constructor(options: DesignerModeWebpackPluginOptions = {}) {
    this.options = {
      port: options.port ?? 3334,
      host: options.host ?? '127.0.0.1',
      framework: options.framework ?? 'auto',
    };
  }

  apply(compiler: Compiler): void {
    const { port, host, framework } = this.options;
    const relayUrl = `http://${host}:${port}`;
    const isDev = compiler.options.mode !== 'production';

    if (!isDev) return; // Only inject in development

    // Start relay server
    compiler.hooks.afterPlugins.tap(PLUGIN_NAME, () => {
      if (this.serverProcess) return;
      try {
        this.serverProcess = spawn(
          'node',
          ['-e', `
            const { createServer } = require('@designer-mode/server');
            const s = createServer();
            s.listen(${port}, '${host}', () => console.error('[designer-mode] relay server on ${relayUrl}'));
            process.on('SIGTERM', () => s.close());
          `],
          { stdio: 'ignore', detached: true }
        );
        this.serverProcess.unref();
      } catch {
        // Ignore — server may already be running
      }
    });

    // Inject client code as a new entry
    compiler.hooks.entryOption.tap(PLUGIN_NAME, (context, entry) => {
      const clientEntry = path.resolve(
        path.dirname(fileURLToPath(import.meta.url)),
        '../runtime/client.js'
      );
      // Inject as additional entry (webpack 5 style)
      compiler.options.entry = async () => {
        const originalEntry = typeof entry === 'function' ? await entry() : entry;
        return {
          ...originalEntry,
          'designer-mode-client': {
            import: [clientEntry],
          },
        };
      };
    });

    // Stop server on done
    compiler.hooks.shutdown.tap(PLUGIN_NAME, () => {
      if (this.serverProcess) {
        this.serverProcess.kill();
        this.serverProcess = null;
      }
    });
  }
}

export default DesignerModeWebpackPlugin;

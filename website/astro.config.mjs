import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  site: 'https://designermode.ai',
  integrations: [
    starlight({
      title: 'Designer Mode',
      description: 'AI-powered UI inspector for any JavaScript framework',
      logo: {
        light: './src/assets/logo-light.svg',
        dark: './src/assets/logo-dark.svg',
        replacesTitle: false,
      },
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/designer-mode-ai/designer-mode' },
      ],
      customCss: ['./src/styles/custom.css'],
      sidebar: [
        {
          label: 'Getting Started',
          items: [
            { label: 'Introduction', slug: 'introduction' },
            { label: 'Quick Start', slug: 'quick-start' },
            { label: 'Agent Setup', slug: 'agent-setup' },
          ],
        },
        {
          label: 'Frameworks',
          items: [
            { label: 'React', slug: 'frameworks/react' },
            { label: 'Vue', slug: 'frameworks/vue' },
            { label: 'Svelte', slug: 'frameworks/svelte' },
            { label: 'Angular', slug: 'frameworks/angular' },
            { label: 'Vanilla JS', slug: 'frameworks/vanilla' },
            { label: 'React Native', slug: 'frameworks/react-native' },
          ],
        },
        {
          label: 'Integrations',
          items: [
            { label: 'Vite Plugin', slug: 'integrations/vite' },
            { label: 'Webpack Plugin', slug: 'integrations/webpack' },
            { label: 'Browser Extension', slug: 'integrations/extension' },
          ],
        },
        {
          label: 'AI Agents',
          items: [
            { label: 'Claude Code', slug: 'agents/claude-code' },
            { label: 'Cursor', slug: 'agents/cursor' },
            { label: 'GitHub Copilot', slug: 'agents/github-copilot' },
            { label: 'Other Agents', slug: 'agents/other' },
          ],
        },
        {
          label: 'Reference',
          items: [
            { label: 'Architecture', slug: 'reference/architecture' },
            { label: 'Relay Server', slug: 'reference/relay-server' },
            { label: 'MCP Server', slug: 'reference/mcp-server' },
            { label: 'Configuration', slug: 'reference/configuration' },
          ],
        },
      ],
    }),
  ],
});

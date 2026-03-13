import path from 'path';

/**
 * Svelte preprocessor for Designer Mode.
 * Injects data-svelte-component, data-svelte-file, and data-svelte-line
 * on the root element of each component during dev builds.
 *
 * @param {{ root?: string }} options
 */
export function designerModePreprocessor(options = {}) {
  return {
    markup({ content, filename }) {
      if (!filename?.endsWith('.svelte')) return { code: content };
      if (process.env.NODE_ENV === 'production') return { code: content };

      const componentName = path.basename(filename, '.svelte');
      const relPath = options.root
        ? path.relative(options.root, filename).replace(/\\/g, '/')
        : filename;

      // Find the first non-script/non-style element tag in the markup
      // Simple regex approach — works for most cases
      const templateContent = content
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '');

      // Match the first HTML element opening tag
      const firstTagMatch = templateContent.match(/<([a-zA-Z][a-zA-Z0-9-]*)([\s\S]*?)>/);
      if (!firstTagMatch) return { code: content };

      const tagName = firstTagMatch[1];
      const attrs = firstTagMatch[2];
      const fullMatch = firstTagMatch[0];
      const matchIndex = content.indexOf(fullMatch);

      if (matchIndex === -1) return { code: content };

      // Don't annotate if already annotated
      if (attrs.includes('data-svelte-component')) return { code: content };

      // Don't annotate svelte: special elements
      if (tagName.startsWith('svelte:')) return { code: content };

      const injection = ` data-svelte-component="${componentName}" data-svelte-file="${relPath}"`;
      const newCode = content.slice(0, matchIndex + fullMatch.length - 1)
        + injection
        + content.slice(matchIndex + fullMatch.length - 1);

      return { code: newCode };
    },
  };
}

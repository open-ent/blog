import type { HtmlTagDescriptor, Plugin } from 'vite';

const defaultConfig = {
  importMapPath: '/assets/importmap.json',
  externals: ['@edifice.io/react', '@edifice.io/client', 'ode-explorer'],
};

export interface ExternalLibsOptions {
  /**
   * URL path to the import map JSON file (absolute path, e.g. '/shared-libs/importmap.json').
   * Loaded at runtime via synchronous XMLHttpRequest before any ES module.
   */
  importMapPath: string;

  /**
   * Package names to externalize from the Rollup bundle.
   * Sub-paths are also externalized (e.g. 'react-dom' externalizes 'react-dom/client' too).
   */
  externals: string[];
}

export function externalLibs({
  importMapPath,
  externals,
}: ExternalLibsOptions = defaultConfig): Plugin {
  return {
    name: 'vite-plugin-external-libs',
    apply: 'build',

    config() {
      return {
        build: {
          rollupOptions: {
            external: (id: string) =>
              externals.some((ext) => id === ext || id.startsWith(`${ext}/`)),
            output: {
              paths: (id: string) => {
                const isSubPath = externals.some((ext) =>
                  id.startsWith(`${ext}/`),
                );
                if (!isSubPath) return id;

                if (id === 'ode-explorer/lib') {
                  return 'ode-explorer/index.js';
                }

                let resolved = id.replace('/dist/', '/');
                const hasExtension = /\.\w+$/.test(resolved.split('/').pop()!);
                if (!hasExtension) {
                  resolved = `${resolved}.js`;
                }
                return resolved;
              },
            },
          },
        },
      };
    },

    transformIndexHtml() {
      const tags: HtmlTagDescriptor[] = [
        {
          tag: 'script',
          children: [
            '(function() {',
            '  var xhr = new XMLHttpRequest();',
            `  xhr.open('GET', '${importMapPath}', false);`,
            '  xhr.send();',
            '  if (xhr.status === 200) {',
            '    var s = document.createElement("script");',
            '    s.type = "importmap";',
            '    s.textContent = xhr.responseText;',
            '    document.currentScript.after(s);',
            '  } else {',
            `    console.error('[external-libs] Failed to load import map from ${importMapPath}:', xhr.status);`,
            '  }',
            '})();',
          ].join('\n'),
          injectTo: 'head-prepend',
        },
      ];

      return tags;
    },
  };
}

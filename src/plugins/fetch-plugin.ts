import * as esbuild from 'esbuild-wasm';
import axios from 'axios';
import localForage from 'localforage';

const libsCache = localForage.createInstance({
  name: 'libscache',
});

const appendCssToHtml = (escapedCss: string) => `
  const style = document.createElement('style');
  style.innerText = '${escapedCss}';
  document.head.appendChild(style);
`;

export const fetchPlugin = (codeInput: string) => {
  return {
    name: 'fetch-plugin',
    setup(build: esbuild.PluginBuild) {
      build.onLoad({ filter: /(^index\.js$)/ }, () => {
        return {
          loader: 'jsx',
          contents: codeInput,
        };
      });

      // esbuild runs all onLoads and skips if it returns null or void
      // this one is not skipped only if there's a cached result
      build.onLoad({ filter: /.*/ }, async (args: any) => {
        const cachedLib = await libsCache.getItem<esbuild.OnLoadResult>(
          args.path
        );

        if (cachedLib) return cachedLib;
      });

      build.onLoad({ filter: /.css$/ }, async (args: any) => {
        const { data, request } = await axios.get(args.path);

        const escapedCss = data
          .replace(/\n/g, '')
          .replace(/"/g, '\\"')
          .replace(/'/g, "\\'");

        const contents = appendCssToHtml(escapedCss);

        const result: esbuild.OnLoadResult = {
          loader: 'jsx',
          contents,
          resolveDir: new URL('./', request.responseURL).pathname,
        };

        await libsCache.setItem(args.path, result);

        return result;
      });

      build.onLoad({ filter: /.*/ }, async (args: any) => {
        const { data, request } = await axios.get(args.path);

        const result: esbuild.OnLoadResult = {
          loader: 'jsx',
          contents: data,
          resolveDir: new URL('./', request.responseURL).pathname,
        };

        await libsCache.setItem(args.path, result);

        return result;
      });
    },
  };
};

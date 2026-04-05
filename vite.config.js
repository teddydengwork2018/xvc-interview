import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { transform } from 'lightningcss';
import { defineConfig } from 'vite';

const THEME_ALIAS = '$/', THEME_NAME = 'default', THEME_SOURCE = 'src/styles/v-scroll.css', THEME_TARGET = `public/themes/${THEME_NAME}/v-scroll.js`;

const toModule = (css_text)=>`export default ${JSON.stringify(css_text)};\n`;
const compressCss = (css_text)=>transform({
  filename: 'v-scroll.css',
  code: Buffer.from(css_text),
  minify: true,
  drafts: {
    nesting: true
  }
}).code.toString();
const createThemePlugin = ()=> {
  let source_file = '', target_file = '';

  const writeTheme = async()=> {
    const css_text = await readFile(source_file, 'utf8'),
      css_code = compressCss(css_text),
      js_code = toModule(css_code);

    await mkdir(dirname(target_file), { recursive: true });
    await writeFile(target_file, js_code, 'utf8');
  };

  return {
    name: 'v-scroll-theme-module',
    configResolved: async(config)=> {
      source_file = resolve(config.root, THEME_SOURCE);
      target_file = resolve(config.root, THEME_TARGET);
      await writeTheme();
    },
    handleHotUpdate: async(ctx)=> {
      if (resolve(ctx.file) !== source_file) {
        return;
      }

      await writeTheme();
    },
    resolveId: (source)=>source.startsWith(THEME_ALIAS) ? { id: source, external: true } : null
  };
};

export default defineConfig({
  base: './',
  plugins: [createThemePlugin()],
  server: {
    host: '0.0.0.0',
    port: 3000
  }
});

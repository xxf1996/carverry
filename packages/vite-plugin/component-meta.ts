import { parse } from 'vue-docgen-api';
import path from 'path';
import glob from 'glob';

async function getMetaData(filePath: string) {
  const doc = await parse(filePath, {
    alias: {
      '@': path.resolve(__dirname, '..'),
    },
    modules: [path.resolve(__dirname, '..')],
  });
  const meta = {
    doc,
  };
  return `export default ${JSON.stringify(meta, null, 2)}`;
}

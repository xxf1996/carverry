import { parse } from 'vue-docgen-api';
import path from 'path';
import glob from 'glob';
import { ComponentMeta } from '@carverry/app/src/typings/editor';
import { getRelativePath } from './file-info';
import { getComponentName } from './template-target';

const metaPattern = /(.+\.vue)\.meta(?:\/\d+)?$/;
const componentInfoPattern = /.*virtual:component-info(\?t=\d+)?$/;

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

function getComponentInfo(): Promise<string> {
  return new Promise((resolve, reject) => {
    const patterns = [
      path.resolve(__dirname, '../components/*.vue'),
      path.resolve(__dirname, '../template/block/*.vue'),
      path.resolve(__dirname, '../views/marketing/seo/**/*.vue'),
    ];
    glob(`{${patterns.join(',')}}`, async (err, files) => {
      if (err) {
        reject(err);
      }
      const infos = await Promise.all(files.map((filePath) => parse(filePath, {
        alias: {
          '@': path.resolve(__dirname, '..'),
        },
        modules: [path.resolve(__dirname, '..')],
      })));
      const infoMap: Record<string, Required<ComponentMeta>> = {};
      files.forEach((filePath, idx) => {
        const key = getRelativePath(filePath) as string;
        infoMap[key] = {
          name: getComponentName(filePath),
          path: key,
          doc: infos[idx],
        };
      });
      resolve(`export default ${JSON.stringify(infoMap, null, 2)}`);
    });
  });
}

export function templateLoadPlugin() {
  return {
    name: 'test-template-plugin',
    resolveId(id: string) {
      // console.log(id);
      if (metaPattern.test(id)) {
        return id;
      }
    },
    async load(id: string) {
      if (metaPattern.test(id)) {
        const paths = id.match(metaPattern);
        if (!paths) {
          return '';
        }
        // 路径上有以/开头就会被识别为绝对路径！
        const res = await getMetaData(path.resolve(__dirname, '..', '..', paths[1].slice(1)));
        return res;
      }
    },
  };
}

export function componentInfoPlugin() {
  return {
    name: 'test-component-info-plugin',
    resolveId(id: string) {
      if (componentInfoPattern.test(id)) {
        console.log('xxxx', `\0${id}`);
        return `\0${id}`;
      }
    },
    async load(id: string) {
      if (componentInfoPattern.test(id)) {
        const source = await getComponentInfo();
        return source;
      }
    },
  };
}

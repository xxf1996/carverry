import { parse } from 'vue-docgen-api';
import { resolve } from 'path';
import { getContext } from '../server/project.js';
import { getFileName, getRelativePath, globAsync } from '../utils/file.js';
import { ComponentInfo } from '@carverry/app/src/typings/editor';

export async function getLoaclComponents() {
  const context = await getContext();
  const pattern = resolve(context.root, context.sourceDir, '**/*.vue');
  const files = await globAsync(pattern);
  const infos = await Promise.all(files.map((filePath) => parse(filePath, {
    // alias: {
    //   '@': resolve(__dirname, '..'),
    // },
    modules: [resolve(context.root, context.sourceDir)],
  })));
  const infoMap: ComponentInfo = {};
  files.forEach((filePath, idx) => {
    const key = getRelativePath(context.root, filePath) as string;
    infoMap[key] = {
      name: getFileName(filePath),
      path: key,
      doc: infos[idx],
    };
  });
  return infoMap;
}

export async function getRemoteComponents() {
  // TODO: 解析远端组件信息
}

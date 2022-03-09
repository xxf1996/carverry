import { parse } from 'vue-docgen-api';
import { resolve } from 'path';
import { getContext } from '../server/project.js';
import { getFileName, getRelativePath, globAsync } from '../utils/file.js';
import { ComponentInfo, ComponentLeafNode, ComponentTree } from '../../app/src/typings/editor';

function getComponentTree(files: string[], rootDir: string): ComponentTree {
  const root: ComponentTree = {
    children: {},
  };
  files.forEach((filePath) => {
    const paths = filePath.split('src/')[1].split('/');
    let curNode = root;
    paths.forEach((p, idx) => {
      if (idx === paths.length - 1) {
        const node: ComponentLeafNode = {
          path: getRelativePath(rootDir, filePath),
        };
        curNode.children[p] = node;
      } else {
        let node = curNode.children[p] as ComponentTree;
        if (!node) {
          node = {
            children: {},
          };
        }
        curNode.children[p] = node;
        curNode = node;
      }
    });
  });

  return root;
}

export async function getLoaclComponents(): Promise<ComponentInfo> {
  const context = await getContext();
  const pattern = resolve(context.root, context.sourceDir, '**/*.vue');
  const files = await globAsync(pattern);
  const infos = await Promise.all(files.map((filePath) => parse(filePath, {
    // alias: {
    //   '@': resolve(__dirname, '..'),
    // },
    modules: [resolve(context.root, context.sourceDir)],
  })));
  const componentTree = getComponentTree(files, context.root);
  const componentMap: ComponentInfo['componentMap'] = {};
  files.forEach((filePath, idx) => {
    const key = getRelativePath(context.root, filePath) as string;
    componentMap[key] = {
      name: getFileName(filePath),
      path: key,
      doc: infos[idx],
    };
  });
  return {
    componentMap,
    componentTree,
  };
}

export async function getRemoteComponents() {
  // TODO: 解析远端组件信息
}

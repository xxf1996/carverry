import { parse } from 'vue-docgen-api';
import { resolve } from 'path';
import { existsSync } from 'fs';
import { readdir } from 'fs/promises';
import { createRequire } from 'module';
import { getContext } from '../server/project.js';
import { getFileName, getRelativePath, globAsync, isDir } from '../utils/file.js';
import { ComponentInfo, ComponentLeafNode, ComponentTree, MaterialItem, MaterialPackage, MaterialPackageGroup } from '@carverry/app/src/typings/editor';

const require = createRequire(import.meta.url);
const MATERIAL_PACKAGE: Record<string, string> = {
  'carverry-material': '示例物料包',
};

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

async function getPackageInfo(rootDir: string, name: string): Promise<MaterialPackage> {
  const info: MaterialPackage = {
    packageName: name,
    name: MATERIAL_PACKAGE[name],
    groups: [],
    installed: false,
  };
  const packageDir = resolve(rootDir, 'node_modules', name);
  const packageConfigPath = resolve(packageDir, 'package.json');

  if (!existsSync(packageConfigPath)) {
    return info;
  }

  const packageConfig = require(packageConfigPath);
  info.version = packageConfig.version;
  info.installed = true;
  const groupMap: Record<string, MaterialPackageGroup> = {};
  const materialRoot = resolve(packageDir, 'dist', 'materials');
  const materials = await readdir(materialRoot);

  for (const material of materials) {
    const materialPath = resolve(materialRoot, material);
    const res = await isDir(materialPath);
    if (!res) {
      continue;
    }
    const meta: MaterialItem['meta'] = require(resolve(materialPath, 'carverry.meta.json'));
    const config: MaterialItem['config'] = require(resolve(materialPath, 'carverry.material.json'));
    const materialItem: MaterialItem = {
      meta,
      config,
    };
    if (groupMap[config.type]) {
      groupMap[config.type].materials.push(materialItem);
    } else {
      groupMap[config.type] = {
        name: config.type,
        materials: [materialItem],
      };
    }
  }

  info.groups = Object.values(groupMap);
  return info;
}

export async function getRemoteComponents(): Promise<MaterialPackage[]> {
  const packages = Object.keys(MATERIAL_PACKAGE);
  const res: MaterialPackage[] = [];
  const context = await getContext();

  for (const name of packages) {
    const info = await getPackageInfo(context.root, name);
    res.push(info);
  }

  return res;
}

export async function getComponentDoc(filePath: string, sourceDir: string) {
  return parse(filePath, {
    modules: [sourceDir],
  });
}

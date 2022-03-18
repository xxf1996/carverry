import { resolve, relative, dirname } from 'path';
import { existsSync } from 'fs';
import { rm, mkdir, writeFile, readdir } from 'fs/promises';
import fse from 'fs-extra';
import replace from 'replace-in-file';
import { createRequire } from 'module';
import { getFileName, globAsync, isDir } from '../utils/file.js';
import { MaterialItem, MaterialItemConfig } from '@carverry/app/src/typings/editor';
import lodash from 'lodash';
import { getComponentDoc } from '../plugins/component-meta.js';

const require = createRequire(import.meta.url);
const { capitalize } = lodash;

function getReplace(key: string, val: string[]) {
  const pattern = new RegExp(`(?<=from )'${key.replace('*', '(.+)')}'`, 'g');
  const replacePath = (match: string, rootDir: string, curPath: string) => {
    const curDir = dirname(curPath);
    const targetPath = resolve(rootDir, val[0].replace('src', 'dist').replace('*', match));
    return relative(curDir, targetPath);
  };

  return {
    pattern,
    replacePath,
  };
}

function getAliasPaths(rootDir: string) {
  const tsconfig = require(resolve(rootDir, 'tsconfig.json'));
  const keys = Object.keys(tsconfig.compilerOptions.paths || {});
  if (keys.length === 0) {
    return [];
  }
  return keys.map((key) => getReplace(key, tsconfig.compilerOptions.paths[key]));
}

async function generateMaterialInfo(dir: string, sourceDir: string, packageName: string) {
  const configPath = resolve(dir, 'carverry.material.json');
  if (!existsSync(configPath)) {
    return Promise.reject(new Error(`没有发现物料【${dir}】的配置文件！`));
  }
  const config: MaterialItemConfig = require(configPath);
  const curDir = getFileName(dir); // 最后一级目录
  const defaultEntry = curDir.split('-').map((word) => capitalize(word)).join('');
  const entryPath = resolve(dir, `${config.entry || defaultEntry}.vue`);
  if (!existsSync(entryPath)) {
    return Promise.reject(new Error(`没有发现物料【${dir}】的入口文件！`));
  }
  const doc = await getComponentDoc(entryPath, sourceDir);
  const meta: MaterialItem['meta'] = {
    doc,
    name: defaultEntry,
    path: `package://${packageName}#${curDir}`,
  };
  await writeFile(resolve(dir, 'carverry.meta.json'), JSON.stringify(meta, null, 2), {
    encoding: 'utf-8',
  });
}

export async function buildMaterialProject(rootDir: string) {
  // TODO: 项目结构合法性校验
  const packageInfo = require(resolve(rootDir, 'package.json'));
  if (!packageInfo.name) {
    return Promise.reject(new Error('没有发现包名！'));
  }
  const outputDir = resolve(rootDir, 'dist');
  if (existsSync(outputDir)) {
    await rm(outputDir, {
      recursive: true, // rm -rf
    });
  }
  await mkdir(outputDir);
  await fse.copy(resolve(rootDir, 'src'), outputDir);
  const replaces = getAliasPaths(rootDir);
  if (replaces.length > 0) {
    console.log(replaces);
    const filePattern = [
      resolve(outputDir, '**/*.vue'),
      resolve(outputDir, '**/*.ts'),
    ];
    const files = await globAsync(`{${filePattern.join(',')}}`);
    for (const replaceItem of replaces) { // 替换alias path
      await Promise.all(files.map((filePath) => replace.replaceInFile({
        files: filePath,
        from: replaceItem.pattern,
        to: (...args) => {
          const relativePath = replaceItem.replacePath(args[1], rootDir, filePath);
          console.log(relativePath);
          return `'${relativePath}'`;
        },
      })));
    }
  }
  const materials = await readdir(resolve(outputDir, 'materials'));
  for (const material of materials) {
    const materialPath = resolve(outputDir, 'materials', material);
    const res = await isDir(materialPath);
    if (!res) {
      continue;
    }
    generateMaterialInfo(materialPath, outputDir, packageInfo.name);
  }
}
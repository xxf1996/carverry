import { getDirname, getFileName } from '../utils/file.js';
import { resolve, relative } from 'path';
import { rmSync, copyFileSync, existsSync } from 'fs';
import { mkdir, writeFile } from 'fs/promises';
import { ComponentOption } from '@carverry/app/src/typings/editor';
import lodash from 'lodash';
import { getContext } from '../server/project.js';

const { uniq, capitalize } = lodash;
// eslint-disable-next-line @typescript-eslint/naming-convention
const __dirname = getDirname(import.meta.url);
const templateDir = resolve(__dirname, '../template');
const context = await getContext();

function cleanDir(dir: string) {
  // TODO：怎样在保存index.vue不被删除的前提下删除文件下其他文件？或者干脆就这样？也许可以整个文件夹进行替换？
  rmSync(dir, {
    recursive: true,
    force: true,
  });
}

export function emptyPage(cacheDir: string) {
  // cleanDir(cacheDir);
  copyFileSync(resolve(templateDir, 'empty.vue'), resolve(cacheDir, 'index.vue'));
}

export function emptyBlock(cacheDir: string) {
  // cleanDir(cacheDir);
  copyFileSync(resolve(templateDir, 'empty-block.vue'), resolve(cacheDir, 'index.vue'));
}

// export function getAliasPath(filePath: string) {
//   const paths = filePath.split('src/');
//   return `'@/${paths[1].replace(/\.ts$/, '')}'`; // .ts后缀不需要
// }

function getRelativePathFromLoacl(curPath: string, localPath: string) {
  const targetPath = resolve(context.root, localPath);
  return `'${relative(curPath, targetPath)}'`;
}

export function getImport(curPath: string, filePath: string, member: string) {
  return `import { ${member} } from ${getRelativePathFromLoacl(curPath, filePath)};`;
}

function getValidSlots(slots: ComponentOption['slots']): ComponentOption['slots'] {
  const res: ComponentOption['slots'] = {};
  Object.entries(slots).forEach(([name, children]) => {
    if (children.length > 0) {
      res[name] = children;
    }
  });
  return res;
}

function getValidProps(props: ComponentOption['props']): ComponentOption['props'] {
  const res: ComponentOption['props'] = {};
  Object.entries(props).forEach(([name, dep]) => {
    if (dep.member && dep.path) {
      res[name] = dep;
    }
  });
  return res;
}

function getValidEvents(events: ComponentOption['events']): ComponentOption['events'] {
  const res: ComponentOption['events'] = {};
  Object.entries(events).forEach(([name, dep]) => {
    if (dep.member && dep.path) {
      res[name] = dep;
    }
  });
  return res;
}

function getTemplate(option: ComponentOption): string {
  // 映射props，注意v-model绑定
  const props = Object.entries(getValidProps(option.props)).map(([name, dep]) => `${dep.model ? 'v-model' : ''}:${name}="${dep.member}"`).join(' ');
  const events = Object.entries(getValidEvents(option.events)).map(([name, dep]) => `@${name}="${dep.member}"`).join(' ');
  // 同级slot转为对应的slot-{name}-{idx}组件形式
  const slots = Object.keys(getValidSlots(option.slots))
    .map((name) => `<template #${name}>${option.slots[name].map((child, idx) => `<slot-${name}-${idx} />`).join('')}</template>`)
    .flat()
    .join('\n');
  const name = getFileName(option.path, false);

  return `<template>
  <${name} ${props} ${events}>
    ${slots}
  </${name}>
</template>`;
}

function getScript(dir: string, option: ComponentOption): string {
  // const curPath = resolve(dir, 'index.vue');
  // 去重避免重复引入；
  const propImports = uniq(Object.values(getValidProps(option.props)).map((dep) => getImport(dir, dep.path, dep.member))).join('\n');
  const eventImports = uniq(Object.values(getValidEvents(option.events)).map((dep) => getImport(dir, dep.path, dep.member))).join('\n');
  const componentImport = `import ${getFileName(option.path, false)} from ${getRelativePathFromLoacl(dir, option.path)};`;
  const slots = Object.keys(getValidSlots(option.slots));
  const slotsImport = slots
    .map((name) => option.slots[name].map((child, idx) => `import Slot${capitalize(name)}${idx} from './slot-${name}-${idx}/index.vue';`))
    .flat()
    .join('\n');

  slots.forEach((name) => {
    option.slots[name].forEach((child, idx) => {
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      generateFile(resolve(dir, `slot-${name}-${idx}`), option.slots[name][idx]);
    });
  });

  return `<script lang="ts" setup>
  ${componentImport}
  ${slotsImport}
  ${propImports}
  ${eventImports}
</script>`;
}

/**
 * 按照block选项生成对应的block代码
 * @param dir 指定的block输出的目录
 * @param option block选项
 */
export async function generateFile(dir: string, option: ComponentOption) {
  if (!existsSync(dir)) { // 检测目录是否存在
    await mkdir(dir);
  }
  const template = getTemplate(option);
  const script = getScript(dir, option);
  const source = [template, script].join('\n\n');
  await writeFile(resolve(dir, 'index.vue'), source, {
    encoding: 'utf-8',
  });
}

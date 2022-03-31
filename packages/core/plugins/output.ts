import { getDirname, getFileName, toCamlCase } from '../utils/file.js';
import { resolve, relative } from 'path';
import { rmSync, copyFileSync, existsSync } from 'fs';
import { mkdir, writeFile } from 'fs/promises';
import { ComponentOption } from '@carverry/app/src/typings/editor';
import lodash from 'lodash';
import { getContext } from '../server/project.js';
import { getDefaultConfig } from '../cli/init.js';
import { ProjectContext } from '../typings/context';

const { uniq, capitalize } = lodash;
// eslint-disable-next-line @typescript-eslint/naming-convention
const __dirname = getDirname(import.meta.url);
const templateDir = resolve(__dirname, '../template');
let context: ProjectContext = {
  root: '',
  alias: {},
  ...getDefaultConfig(),
};

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

/**
 * 根据组件路径输出对应的import语句
 * @param curPath 当前文件夹
 * @param componentPath 组件路径
 * @returns 
 */
function getComponentImport(curPath: string, componentPath: string): string {
  const packageRule = /package:\/\/([^#]+)#(.+)/; // 物料包识别
  const isPackage = packageRule.test(componentPath);
  if (!isPackage) {
    return `import ${getFileName(componentPath, false)} from ${getRelativePathFromLoacl(curPath, componentPath)};`;
  }
  const packageInfo = componentPath.match(packageRule);

  if (!packageInfo) {
    return '';
  }

  const componentName = toCamlCase(packageInfo[2]);
  let importStr = `import ${componentName} from '${packageInfo[1]}/dist/materials/${packageInfo[2]}';`; // 符合标准的自建物料库结构

  switch (packageInfo[1]) {
    // 针对第三方UI库单独适配
    case 'carverry-element-plus':
      importStr = `import { ${componentName} } from 'element-plus';`;
      break;
    default:
      break;
  }

  return importStr;
}

function getComponentName(componentPath: string) {
  const packageRule = /package:\/\/([^#]+)#(.+)/; // 物料包识别
  const packageInfo = componentPath.match(packageRule);
  if (!packageInfo) {
    return getFileName(componentPath, false);
  }

  return toCamlCase(packageInfo[2]);
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
  const name = getComponentName(option.path);

  return `<template>
  <${name} ${props} ${events}>
    ${slots}
  </${name}>
</template>`;
}

function getPreviewTemplate(option: ComponentOption): string {
  // 映射props，注意v-model绑定
  const props = Object.entries(getValidProps(option.props)).map(([name, dep]) => `${dep.model ? 'v-model' : ''}:${name}="${dep.member}"`).join(' ');
  const events = Object.entries(getValidEvents(option.events)).map(([name, dep]) => `@${name}="${dep.member}"`).join(' ');
  // 同级slot转为对应的slot-{name}-{idx}组件形式
  const slots = Object.keys(option.slots)
    .map((name) => {
      const skip = option.slots[name].some((slot) => slot.skip);
      if (skip) { // 跳过slot，直接为空
        return '';
      }
      if (option.slots[name].length > 0) {
        return `<template #${name}>${option.slots[name].map((child, idx) => `<slot-${name}-${idx} carverry-parent="${option.key}" carverry-slot="${name}" data-carverry-child="${idx}" key="${[option.key, name, idx, Date.now()].join('-')}" />`).join('')}</template>`; // 加上key是为了保证交换顺序时强制更新
      }
      return `<template #${name}><div data-carverry-parent="${option.key}" data-carverry-slot="${name}" data-carverry-empty="true">${name}【将组件拖拽到此处进行添加】</div></template>`;
    })
    .flat()
    .join('\n');
  const name = getComponentName(option.path);

  return `<template>
  <${name} ref="containerRef" data-carverry-key="${option.key}" @slot-append.stop="slotAppend" ${props} ${events}>
    ${slots}
  </${name}>
</template>`;
}

function getScript(dir: string, option: ComponentOption): string {
  // 去重避免重复引入；
  const propImports = uniq(Object.values(getValidProps(option.props)).map((dep) => getImport(dir, dep.path, dep.member))).join('\n');
  const eventImports = uniq(Object.values(getValidEvents(option.events)).map((dep) => getImport(dir, dep.path, dep.member))).join('\n');
  const componentImport = getComponentImport(dir, option.path);
  const slots = Object.keys(getValidSlots(option.slots));
  const slotsImport = slots
    .map((name) => option.slots[name].map((child, idx) => `import Slot${capitalize(name)}${idx} from './slot-${name}-${idx}/index.vue';`))
    .flat()
    .join('\n');

  slots.forEach((name) => {
    option.slots[name].forEach((child, idx) => {
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      generateFile(resolve(dir, `slot-${name}-${idx}`), option.slots[name][idx], false);
    });
  });

  return `<script lang="ts" setup>
${componentImport}
${slotsImport}
${propImports}
${eventImports}
</script>`;
}

function getPreviewScript(dir: string, option: ComponentOption): string {
  // 去重避免重复引入；
  const propImports = uniq(Object.values(getValidProps(option.props)).map((dep) => getImport(dir, dep.path, dep.member))).join('\n');
  const eventImports = uniq(Object.values(getValidEvents(option.events)).map((dep) => getImport(dir, dep.path, dep.member))).join('\n');
  const componentImport = getComponentImport(dir, option.path);
  const slots = Object.keys(getValidSlots(option.slots));
  const slotsImport = slots
    .map((name) => option.slots[name].map((child, idx) => `import Slot${capitalize(name)}${idx} from './slot-${name}-${idx}/index.vue';`))
    .flat()
    .join('\n');

  slots.forEach((name) => {
    option.slots[name].forEach((child, idx) => {
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      generateFile(resolve(dir, `slot-${name}-${idx}`), option.slots[name][idx], true);
    });
  });

  return `<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { initSlotContainer, changeConfig } from 'carverry';
import { SlotAppendEvent } from '@carverry/app/src/typings/editor';
${componentImport}
${slotsImport}
${propImports}
${eventImports}

const containerRef = ref<HTMLElement>();
const props = defineProps({
  carverryParent: {
    type: String,
    default: '',
  },
  carverrySlot: {
    type: String,
    default: '',
  },
}); // 组件的dataset设置不一定有作用

function slotAppend(e: CustomEvent<SlotAppendEvent>) {
  changeConfig(e.detail.slot, e.detail.meta, '${option.key}');
}

onMounted(() => {
  if (!containerRef.value) {
    return;
  }
  let el: HTMLElement = containerRef.value.$el || containerRef.value;
  if (el.nodeName === '#text' && el.nextElementSibling) {
    el = el.nextElementSibling as HTMLElement;
  }
  el.dataset.carverryKey = '${option.key}'; // 双重保险，避免有些组件吞了attribute设置
  el.dataset.carverryParent = props.carverryParent;
  el.dataset.carverrySlot = props.carverrySlot;
  initSlotContainer(el);
});
</script>`;
}

/**
 * 按照block选项生成对应的block代码
 * @param dir 指定的block输出的目录
 * @param option block选项
 * @param preview 是否为预览输出
 */
export async function generateFile(dir: string, option: ComponentOption, preview: boolean) {
  if (!existsSync(dir)) { // 检测目录是否存在
    await mkdir(dir);
  }
  context = await getContext();
  const template = preview ? getPreviewTemplate(option) : getTemplate(option);
  const script = preview ? getPreviewScript(dir, option) : getScript(dir, option);
  const source = [template, script].join('\n\n');
  await writeFile(resolve(dir, 'index.vue'), source, {
    encoding: 'utf-8',
  });
}

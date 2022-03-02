import { capitalize, uniq } from 'lodash';
import path from 'path';
import { promises, existsSync } from 'fs';
import { ComponentOption } from '@carverry/app/src/typings/editor';
import {
  getAliasPath, getComponentName, getImport, getValidEvents, getValidProps,
} from './template-target';

const reg = /.*page-generator\?option=(.+)/;

function getValidSlots(slots: ComponentOption['slots']): ComponentOption['slots'] {
  const res: ComponentOption['slots'] = {};
  Object.entries(slots).forEach(([name, children]) => {
    if (children.length > 0) {
      res[name] = children;
    }
  });
  return res;
}

function getTemplate(option: ComponentOption): string {
  // const props = Object.entries(getValidProps(option.props)).map(([name, dep]) => `:${name}="${dep.member}"`).join(' ');
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

function getScript(dir: string, option: ComponentOption): string {
  // 去重避免重复引入；
  const propImports = uniq(Object.values(getValidProps(option.props)).map((dep) => getImport(dep.path, dep.member))).join('\n');
  const eventImports = uniq(Object.values(getValidEvents(option.events)).map((dep) => getImport(dep.path, dep.member))).join('\n');
  const componentImport = `import ${getComponentName(option.path)} from ${getAliasPath(option.path)};`;
  const slots = Object.keys(getValidSlots(option.slots));
  const slotsImport = slots
    .map((name) => option.slots[name].map((child, idx) => `import Slot${capitalize(name)}${idx} from './slot-${name}-${idx}/index.vue';`))
    .flat()
    .join('\n');

  slots.forEach((name) => {
    option.slots[name].forEach((child, idx) => {
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      generateFile(path.resolve(dir, `slot-${name}-${idx}`), option.slots[name][idx]);
    });
  });

  return `<script lang="ts" setup>
  ${componentImport}
  ${slotsImport}
  ${propImports}
  ${eventImports}
</script>`;
}

async function saveConfig(dir: string, option: ComponentOption) {
  if (!existsSync(dir)) { // 检测目录是否存在
    await promises.mkdir(dir);
  }
  await promises.writeFile(path.resolve(dir, 'page-config.json'), JSON.stringify(option, null, 2), {
    encoding: 'utf-8',
  });
}

async function generateFile(dir: string, option: ComponentOption) {
  console.log('generateFile', option);
  if (!existsSync(dir)) { // 检测目录是否存在
    await promises.mkdir(dir);
  }
  const template = getTemplate(option);
  const script = getScript(dir, option);
  const source = [template, script].join('\n\n');
  await promises.writeFile(path.resolve(dir, 'index.vue'), source, {
    encoding: 'utf-8',
  });
}

export function pageGeneratorPlugin() {
  return {
    name: 'page-generator-plugin',
    resolveId(id: string) {
      if (reg.test(id)) {
        return `\0${id}`;
      }
    },
    async load(id: string) {
      if (reg.test(id)) {
        const options = id.match(reg);
        if (!options) {
          return '';
        }
        try {
          const option: {
            name: string;
            data: ComponentOption;
          } = JSON.parse(options[1]);
          const { name, data } = option;
          const targetDir = path.resolve(__dirname, '../blocks', name);
          console.log(targetDir, data);
          await saveConfig(targetDir, data);
          await generateFile(targetDir, data);
          return '';
        } catch (err) {
          console.log(err);
          return '';
        }
      }
    },
  };
}

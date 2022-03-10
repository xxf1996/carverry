import { promises } from 'fs';
import { uniq } from 'lodash';
import path from 'path';
import { ComponentOption } from '@carverry/app/src/typings/editor';
import { getOptionByKey } from '../views/template-editor/state';

const reg = /.*template-target\?key=(.*)(&t=\d+)?$/;

export function getComponentName(filePath: string) {
  const paths = filePath.split('/');
  const name = paths[paths.length - 1].split('.')[0];

  return name;
}

export function getAliasPath(filePath: string) {
  const paths = filePath.split('src/');
  return `'@/${paths[1].replace(/\.ts$/, '')}'`; // .ts后缀不需要
}

export function getImport(filePath: string, member: string) {
  return `import { ${member} } from ${getAliasPath(filePath)};`;
}

export function getValidProps(props: ComponentOption['props']): ComponentOption['props'] {
  const res: ComponentOption['props'] = {};
  Object.entries(props).forEach(([name, dep]) => {
    if (dep.member && dep.path) {
      res[name] = dep;
    }
  });
  return res;
}

export function getValidEvents(events: ComponentOption['events']): ComponentOption['events'] {
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
  // slots透传
  const slots = Object.keys(option.slots).map((name) => `<template v-if="$slots.${name}" #${name}><slot name="${name}" /></template>`).join('\n');
  const name = getComponentName(option.path);

  return `<template>
  <${name} ${props} ${events}>
    ${slots}
  </${name}>
</template>`;
}

function getScript(option: ComponentOption): string {
  // 去重避免重复引入；
  const propImports = uniq(Object.values(getValidProps(option.props)).map((dep) => getImport(dep.path, dep.member))).join('\n');
  const eventImports = uniq(Object.values(getValidEvents(option.events)).map((dep) => getImport(dep.path, dep.member))).join('\n');
  const componentImport = `import ${getComponentName(option.path)} from ${getAliasPath(option.path)};`;

  return `<script lang="ts" setup>
  ${componentImport}
  ${propImports}
  ${eventImports}
</script>`;
}

function getFile(option: ComponentOption): string {
  const template = getTemplate(option);
  const script = getScript(option);

  return [template, script].join('\n\n');
}

export function templateTargetPlugin() {
  return {
    name: 'test-template-target-plugin',
    resolveId(id: string) {
      if (reg.test(id)) {
        return `\0${id}`;
      }
    },
    async load(id: string) {
      if (reg.test(id)) {
        console.log(id);
        const options = id.match(reg);
        if (!options) {
          return '';
        }
        try {
          // 先解压字符串
          // const { decompress } = await import('lzw-compressor');
          // const option: Required<ComponentOption> = JSON.parse(decompress(options[1]));
          const blockOption = await promises.readFile(path.resolve(__dirname, '../.cache/blockOption.json'), { encoding: 'utf-8' });
          const key = options[1] || '';
          const option = getOptionByKey(JSON.parse(blockOption), key);
          console.log(key, option);
          const source = getFile(option);
          const filename = `template-target-${option.key || 'root'}`; // 使用固定文件名有助于vite缓存依赖关系
          await promises.writeFile(path.resolve(__dirname, '../.cache', `${filename}.vue`), source, {
            encoding: 'utf-8',
          });
          return `import A from '@/.cache/${filename}.vue';\nexport default A;`;
        } catch (err) {
          console.log(err);
          return '';
        }
      }
    },
  };
}

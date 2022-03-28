import { getComponentDoc } from './component-meta.js';
import { resolve } from 'path';
import { createRequire } from 'module';
import { existsSync } from 'fs';
import { readdir, rm, mkdir, writeFile } from 'fs/promises';
import { promiseError } from '../utils/tip.js';
import type { ComponentObjectPropsOptions, ComponentOptionsWithObjectProps, EmitsOptions, Prop, PropType } from 'vue';
import type { ComponentDoc, EventDescriptor, PropDescriptor } from 'vue-docgen-api';
import { MaterialItem } from '@carverry/app/src/typings/editor';

const require = createRequire(import.meta.url);

function getProptype(propType: PropType<unknown>): string {
  let type = 'unknown';
  if (Array.isArray(propType)) {
    type = 'array';
  } else if (propType === Boolean) {
    type = 'boolean';
  } else if (propType === Number) {
    type = 'number';
  } else if (propType === String) {
    type = 'string';
  } else if (propType === Date) {
    type = 'date';
  } else if (propType === Object) {
    type = 'object';
  }

  return type;
}

/**
 * 将组件选项中的单个prop信息解析为doc描述
 * @param prop prop选项
 * @param name prop key
 */
function propToDescriptor(prop: Prop<unknown>, name: string): PropDescriptor {
  const descriptor: PropDescriptor = {
    name,
  };
  if (typeof prop === 'function') {
    descriptor.type = {
      name: 'unknown',
      func: true,
    };
  } else if (Array.isArray(prop)) {
    descriptor.type = {
      name: 'array',
    };
  } else {
    descriptor.type = {
      name: prop.type && (typeof prop.type !== 'boolean') ? getProptype(prop.type) : 'unknown',
    };
    descriptor.required = prop.required;
    // descriptor.values = prop.values;
    descriptor.defaultValue = {
      value: prop.default as any,
      func: typeof prop.default === 'function',
    };
  }
  return descriptor;
}

/**
 * 将组件emit选项转换为doc描述
 * @param events emit选项
 */
function eventsToDescriptors(events: EmitsOptions): EventDescriptor[] {
  const descriptors: EventDescriptor[] = [];
  if (Array.isArray(events)) {
    events.forEach((name) => {
      descriptors.push({
        name,
      });
    });
  } else {
    for (const name in events) {
      // const event = events[name]; // TODO: 函数类型解析
      descriptors.push({
        name,
      });
    }
  }

  return descriptors;
}

/**
 * 将组件的选项信息转换为对应的元数据
 * @param options 组件选项
 */
function optionsToDoc(options: ComponentOptionsWithObjectProps): ComponentDoc {
  const doc: ComponentDoc = {
    displayName: options.name || '',
    exportName: 'default',
    props: [],
    events: [],
  };
  const props = options.props as ComponentObjectPropsOptions;
  const emits = options.emits as EmitsOptions | undefined;

  for (const key in props) {
    const prop = props[key];
    if (!prop) {
      continue;
    }
    const desc = propToDescriptor(prop, key);
    doc.props?.push(desc);
  }

  if (emits) {
    const events = eventsToDescriptors(emits);
    doc.events = events;
  }

  return doc;
}

/**
 * element-plus组件转化为物料
 * @param rootDir 物料库根目录
 */
export async function elementPlusTransformer(rootDir: string) {
  const packageInfo = require(resolve(rootDir, 'package.json'));
  const sourceRoot: string = packageInfo?.carverry?.target;
  if (!sourceRoot) {
    return promiseError('没有发现carverry.target字段！');
  }
  if (!existsSync(sourceRoot)) {
    return promiseError('没有发现element-plus本地仓库！');
  }
  const targetRoot = resolve(rootDir, 'node_modules', 'element-plus');
  if (!existsSync(targetRoot)) {
    return promiseError('没有安装element-plus包！');
  }
  /** 基于lib获取组件的option信息（编译后的） */
  const componentRoot = resolve(targetRoot, 'lib', 'components');
  /** 基于源码获取元数据（部分，elemen-plus高度模块化，所以events和props信息无法根据AST正确解析） */
  const componentSource = resolve(sourceRoot, 'packages', 'components');
  const componentPaths = await readdir(componentRoot);
  const components = componentPaths.filter((name) => existsSync(resolve(componentRoot, name, 'index.js')));
  const outputDir = resolve(rootDir, 'dist');
  if (existsSync(outputDir)) {
    await rm(outputDir, {
      recursive: true, // rm -rf
    });
  }
  const materialRoot = resolve(outputDir, 'materials');
  await mkdir(outputDir);
  await mkdir(materialRoot);
  components.forEach(async (name) => {
    const lib = require(resolve(componentRoot, name, 'index.js'));
    let sourcePath = resolve(componentSource, name, 'src', `${name}.vue`);
    if (!existsSync(sourcePath)) {
      sourcePath = resolve(componentSource, name, 'src', 'index.vue');
    }
    if (!existsSync(sourcePath)) {
      return;
    }
    const libDoc = optionsToDoc(lib.default || {});
    const doc = await getComponentDoc(sourcePath, resolve(sourceRoot, 'packages'));
    libDoc.slots = doc.slots; // 无法从组件option获取到slots信息
    const dirName = `el-${name}`; // 加上前缀，便于引入
    const materialPath = resolve(materialRoot, dirName);
    const meta: MaterialItem['meta'] = {
      doc: libDoc,
      name: libDoc.displayName,
      path: `package://carverry-element-plus#${dirName}`,
    };
    await mkdir(materialPath);
    await writeFile(resolve(materialPath, 'carverry.meta.json'), JSON.stringify(meta, null, 2), {
      encoding: 'utf-8',
    });
    await writeFile(resolve(materialPath, 'carverry.material.json'), JSON.stringify({
      '$schema': 'https://xiexuefeng.cc/schema/carverry-material.json',
      title: name,
      desc: `element-plus的${name}组件`,
      type: 'test',
    }, null, 2), {
      encoding: 'utf-8',
    });
    await writeFile(resolve(materialPath, 'index.ts'), `import { ${libDoc.displayName} } from 'element-plus';\nimport 'element-plus/es/components/${name}/style/index';\nexport default ${libDoc.displayName};`, {
      encoding: 'utf-8',
    });
  });
}

import { computed, ref } from 'vue';
import { useLocalStorage } from '@vueuse/core';
import {
  ComponentInfo,
  ComponentMeta, ComponentOption, FileInfo, MaterialPackage,
} from '@/typings/editor';
import { Nullable } from '@/typings/common';

export const curOption = ref<ComponentOption>();
export const fileInfo = ref<FileInfo>({
  fileMap: {},
  fileTree: { children: {} },
});
/** 本地组件信息 */
export const localComponents = ref<ComponentInfo>({
  componentMap: {},
  componentTree: {
    children: {},
  },
});
/** 物料包信息 */
export const packages = ref<MaterialPackage[]>([]);
export const curDragComponent = ref<Required<ComponentMeta>>();
export const curEditKey = ref('');
/** 当前进行操作的block名称 */
export const curBlock = ref('');
/** 所有组件（包括已经加载的物料库）元数据映射，key为组件唯一标识符（path），value为组件元数据 */
export const componentMap = computed<ComponentInfo['componentMap']>(() => {
  const allMap: ComponentInfo['componentMap'] = Object.assign(localComponents.value.componentMap);
  for (const pkg of packages.value) {
    for (const group of pkg.groups) {
      for (const material of group.materials) {
        allMap[material.meta.path] = material.meta;
        if (material.config.desc) {
          allMap[material.meta.path].doc.description = material.config.desc; // 替换描述
        }
      }
    }
  }
  return allMap;
});
/** 当前选中模板元信息 */
export const curMeta = computed<Nullable<Required<ComponentMeta>>>(() => {
  if (!curBlock.value || !curOption.value || !componentMap.value[curOption.value.path]) {
    return null;
  }
  return componentMap.value[curOption.value.path];
});
/** 操作的block配置 */
export const blockOption = useLocalStorage<ComponentOption>('carverry_blockOption', {
  path: '', // 空的path代表是一个空的block，初始状态
  key: '',
  props: {},
  events: {},
  slots: {},
});
/** 是否正在拖拽组件 */
export const dragging = computed(() => !!curDragComponent.value);

// TODO: 组件类设置支持，共享项目上下文（taliwind）

export function initBlockOption() {
  blockOption.value = {
    path: '', // 空的path代表是一个空的block，初始状态
    key: '',
    props: {},
    events: {},
    slots: {},
  };
}

export function getOptionByKey(tree: ComponentOption, key: string): ComponentOption {
  let res = tree;
  const paths = key.split('-');

  if (paths.length % 2 === 0) {
    for (let i = 0; i < paths.length; i += 2) {
      const idx = Number(paths[i + 1]);
      res = res.slots[paths[i]][idx]; // 找到下一层级
    }
  }

  return res;
}

export async function updateFileInfo() {
  // 获取当前项目逻辑文件信息
  const data = await fetch('/editor-api/files', {
    method: 'get',
  }).then((res) => {
    return res.json() as Promise<FileInfo>;
  });
  fileInfo.value = data;
}

export async function updateLocalComponents() {
  const data = await fetch('/editor-api/components/local', {
    method: 'get',
  }).then((res) => {
    return res.json() as Promise<ComponentInfo>;
  });
  localComponents.value = data;
}

export async function updatePackages() {
  const data = await fetch('/editor-api/components/remote', {
    method: 'get',
  }).then((res) => {
    return res.json() as Promise<MaterialPackage[]>;
  });
  packages.value = data;
}

export async function getBlocks() {
  const blocks: string[] = await fetch('/editor-api/block', {
    method: 'get',
  }).then((res) => res.json());
  return blocks;
}

export async function getBlockConfig(name: string) {
  const config: ComponentOption = await fetch(`/editor-api/config/${name}`, {
    method: 'get',
  }).then((res) => res.json());
  return config;
}

export async function updatePreview() {
  await fetch('/editor-api/preview', {
    method: 'post',
    body: JSON.stringify({
      block: curBlock.value,
      option: JSON.stringify(blockOption.value),
    }),
  });
}

export async function generateCode() {
  if (!curBlock.value) {
    return;
  }
  await fetch('/editor-api/generate', {
    method: 'post',
    body: JSON.stringify({
      block: curBlock.value,
      option: JSON.stringify(blockOption.value),
    }),
  });
}

export function updateOptionKey(option: ComponentOption, prefix = '') {
  // eslint-disable-next-line no-restricted-syntax,guard-for-in
  for (const slot in option.slots) {
    option.slots[slot].forEach((item, idx) => {
      item.key = prefix ? `${prefix}-${slot}-${idx}` : `${slot}-${idx}`;
      updateOptionKey(item, item.key);
    });
  }
}

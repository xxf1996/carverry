import { computed, ref } from 'vue';
import { useLocalStorage, useEventBus, useRefHistory } from '@vueuse/core';
import {
  ComponentInfo,
  ComponentMeta, ComponentOption, FileInfo, MaterialPackage, TemplateInfo,
} from '@/typings/editor';
import { Nullable } from '@/typings/common';
import { ProjectContext } from '@carverry/core/typings/context';
import router from '@/router';

export const pageBus = useEventBus<string>(Symbol('page'));
/** 当前选中的组件配置 */
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
export const curEditKey = ref<string>();
/** 当前进行操作的block名称 */
export const curBlock = computed<string>(() => (router.currentRoute.value.query.block as string) || '');
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
  if (!curBlock.value || !curOption.value || !componentMap.value[curOption.value.path] || curEditKey.value === undefined) {
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
export const {
  history: blockHistory,
  /** redo block配置 */
  redo: blockRedo,
  /** undo block配置 */
  undo: blockUndo,
  canRedo: blockCanRedo,
  canUndo: blockCanUndo,
} = useRefHistory(blockOption, {
  deep: true,
});
/** 最近使用的文件路径（最多记录10条） */
export const recentPaths = useLocalStorage<string[]>('carverry_recentPaths', []);
/** 是否正在拖拽组件 */
export const dragging = computed(() => !!curDragComponent.value);
/** 当前项目上下文信息 */
export const projectContext = ref<ProjectContext>();
/** 项目block列表 */
export const blocks = ref<string[]>([]);
/** 本地模板列表 */
export const templates = ref<TemplateInfo[]>([]);

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
  const list: string[] = await fetch('/editor-api/block', {
    method: 'get',
  }).then((res) => res.json());
  return list;
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
  // pageBus.emit('reload');
}

export async function updateContext() {
  const context: ProjectContext = await fetch('/editor-api/context', {
    method: 'get',
  }).then((res) => res.json());
  projectContext.value = context;
}

export async function updateTemplates() {
  const list: TemplateInfo[] = await fetch('/editor-api/templates/all', {
    method: 'get',
  }).then((res) => res.json());
  templates.value = list;
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

export function updateRecentPaths(filePath: string) {
  if (!filePath) {
    return;
  }
  if (recentPaths.value.includes(filePath)) {
    const idx = recentPaths.value.indexOf(filePath);
    recentPaths.value.splice(idx, 1);
    recentPaths.value.unshift(filePath);
  } else if (recentPaths.value.length < 10) {
    recentPaths.value.unshift(filePath);
  } else {
    recentPaths.value = [filePath, ...recentPaths.value.slice(0, -1)];
  }
}

/** 更新block列表 */
export async function updateBlocks() {
  const data = await getBlocks();
  blocks.value = data;
}

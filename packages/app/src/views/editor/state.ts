import { ref } from 'vue';
import { useLocalStorage } from '@vueuse/core';
import {
  ComponentInfo,
  ComponentMeta, ComponentOption, FileInfo,
} from '@/typings/editor';

/** 当前选中模板元信息 */
export const curMeta = ref<ComponentMeta>();
export const curOption = ref<ComponentOption>();
export const fileInfo = ref<FileInfo>({
  fileMap: {},
  fileTree: { children: {} },
});
export const componentInfo = ref<ComponentInfo>({
  componentMap: {},
  componentTree: {
    children: {},
  },
});
export const curDragComponent = ref<Required<ComponentMeta>>();
export const curEditKey = ref('');
// TODO: 从配置文件加载
export const pageOption = useLocalStorage<ComponentOption>('carverry_pageOption', {
  path: 'src/template/CommonPage.vue',
  key: '',
  props: {},
  events: {},
  slots: {
    btns: [],
    content: [],
  },
});

// TODO: 组件类设置支持，共享项目上下文（taliwind）

export function initPageOption() {
  pageOption.value = {
    path: 'src/template/CommonPage.vue',
    key: '',
    props: {},
    events: {},
    slots: {
      btns: [
        {
          path: 'src/components/AnalysisRange.vue',
          props: {},
          events: {},
          slots: {},
        },
      ],
      content: [],
    },
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

export async function updateComponnetInfo() {
  const data = await fetch('/editor-api/components/local', {
    method: 'get',
  }).then((res) => {
    return res.json() as Promise<ComponentInfo>;
  });
  componentInfo.value = data;
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

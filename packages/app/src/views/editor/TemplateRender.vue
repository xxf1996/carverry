<template>
  <div
    :class="selected ? 'border-teal-500 border border-dashed' : ''"
    @click.capture="toggleSelect"
  >
    <!-- 关于异步组件的ref绑定：https://github.com/vuejs/core/issues/2671#issuecomment-736127481 -->
    <suspense>
      <template #default>
        <template-target
          ref="targetRef"
          @slot-append.stop="slotAppend"
          @slot-change.stop="slotChange"
        >
          <template
            v-for="(children, name) in slots"
            :key="`slot-${name}`"
            #[name]
          >
            <template v-if="children.length > 0">
              <template-render
                v-for="(child, idx) in children"
                :key="child.path"
                :option="child"
                :render-key="renderKey ? `${renderKey}-${name}-${idx}` : `${name}-${idx}`"
                :data-slot="name"
                :data-idx="idx"
                @update-target="emit('update-target')"
                @update-template="emit('update-template')"
              />
            </template>
            <div
              v-else
              :data-slot="name"
            >
              {{ name }}
            </div>
          </template>
        </template-target>
      </template>
      <template #fallback>
        <p>加载中……</p>
      </template>
    </suspense>
  </div>
</template>

<script lang="ts" setup>
import {
  defineAsyncComponent, ComponentPublicInstance, ref, computed, watch, nextTick,
} from 'vue';
import type { ComponentDoc } from 'vue-docgen-api';
import {
  curDragComponent,
  curEditKey, curMeta, curOption, getOptionByKey, blockOption, updateOptionKey,
} from './state';
import { ComponentMeta, ComponentOption } from '@/typings/editor';

const props = defineProps<{
  option: ComponentOption;
  /** 配置树上对应的完整路径 */
  renderKey: string;
}>();
const emit = defineEmits<{ (event: 'update-target'): void;
  (event: 'update-template'): void,
}>();
const slots = computed(() => props.option.slots);
const targetRef = ref<typeof TemplateTarget | null>(null);
const selected = computed(() => props.renderKey === curEditKey.value);
const templateOption = computed(() => getOptionByKey(blockOption.value, props.renderKey));

const meta = ref<ComponentMeta>();
const loadedTime = ref(Date.now());
const TemplateTarget = defineAsyncComponent({
  loader: () => new Promise<ComponentPublicInstance>((resolve, reject) => {
    // 相同路径会有缓存，需要实时的
    const targetLoader: () => Promise<ComponentPublicInstance> = () => import(`./${Date.now()}/template-target?key=${props.renderKey}`); // 带t确保为最新结果
    const metaLoader: () => Promise<{ default: ComponentMeta }> = () => import(`../../../${props.option.path}.meta/${Date.now()}`);
    fetch('/editor-api/sync', {
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-cache',
      method: 'POST',
      body: JSON.stringify(blockOption.value),
    }).then(() => Promise.all([targetLoader(), metaLoader()])).then(([targetRes, metaRes]) => {
      resolve(targetRes);
      meta.value = metaRes.default;
      if (!curMeta.value) {
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        initOption();
        curMeta.value = meta.value;
      }
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      setTimeout(updateTargetStyle, 500);
    }).catch((err: Error) => {
      reject(err || new Error('没有指定组件'));
    });
  }),
});

/**
 * 获取一个组件的初始配置
 * @param path 组件路径
 * @param doc 组件文档信息
 */
function getInitOption(path: string, doc: ComponentDoc): ComponentOption {
  const option: ComponentOption = {
    path,
    key: props.renderKey,
    props: {},
    slots: {},
    events: {},
  };
  doc.props?.forEach((prop) => {
    option.props[prop.name] = {
      path: '',
      member: '',
      model: false,
    };
  });
  doc.events?.forEach((event) => {
    option.events[event.name] = {
      path: '',
      member: '',
    };
  });
  doc.slots?.forEach((slot) => {
    option.slots[slot.name] = [];
  });

  return option;
}

function initOption() {
  if (!meta.value) {
    return;
  }
  const option = getOptionByKey(blockOption.value, props.renderKey);
  meta.value.doc.props?.forEach((prop) => {
    if (!option.props[prop.name]) {
      option.props[prop.name] = {
        path: '',
        member: '',
        model: false,
      };
    }
  });
  meta.value.doc.events?.forEach((event) => {
    if (!option.events[event.name]) {
      option.events[event.name] = {
        path: '',
        member: '',
      };
    }
  });
  meta.value.doc.slots?.forEach((slot) => {
    if (!option.slots[slot.name]) {
      option.slots[slot.name] = [];
    }
  });
  curOption.value = option;
}

function toggleSelect() {
  console.log(props.renderKey);
  if (curEditKey.value !== props.renderKey) {
    initOption();
    curMeta.value = meta.value;
    curEditKey.value = props.renderKey;
  }
}

/** 向上通知初始化 */
function updateTargetStyle() {
  if (!targetRef.value) {
    return;
  }
  emit('update-target');
}

/**
 * 向容器内插入新的组件
 * @param e
 */
function slotAppend(e: Event) {
  if (!e.target || !curDragComponent.value) {
    return;
  }
  const triggeredSlot = (e.target as HTMLElement).dataset.slot || '';
  if (!triggeredSlot) {
    return;
  }
  const option = getOptionByKey(blockOption.value, props.renderKey);
  option.slots[triggeredSlot].push(getInitOption(curDragComponent.value.path, curDragComponent.value.doc));
  updateOptionKey(blockOption.value);
  nextTick(() => {
    curDragComponent.value = undefined; // drop处理完后清空，用于识别其他情况的拖拽
  });
}

/**
 * 容器内元素排序改变，同步改变对应的配置顺序
 * @param e
 */
function slotChange(e: CustomEvent<{ oldIdx: number; newIdx: number; slot: string; }>) {
  const option = getOptionByKey(blockOption.value, props.renderKey);
  if (!e.target) {
    return;
  }
  const { slot } = e.detail;
  const origin = option.slots[slot];
  // :scope伪类代表当前元素层级；https://stackoverflow.com/questions/3680876/using-queryselectorall-to-retrieve-direct-children
  const slotChildren = Array.from((e.target as HTMLElement).querySelectorAll(`:scope > [data-slot="${slot}"]`));
  const curIdx = slotChildren.map((child) => Number((child as HTMLElement).dataset.idx));
  option.slots[slot] = curIdx.map((val) => origin[val]);
  updateOptionKey(blockOption.value);
}

defineExpose({
  toggleSelect,
});

watch(templateOption, (val) => {
  console.log('templateOption', val);
  loadedTime.value = Date.now();
  emit('update-template');
}, { deep: true });
// watch(targetRef, (val) => {
//   console.log('targetRef', val);
// }, { deep: true });
</script>

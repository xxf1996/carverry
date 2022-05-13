<template>
  <div class="grid grid-cols-2 gap-4">
    <draggable
      :list="items"
      :group="{ name: 'template', pull: 'clone', put: false }"
      item-key="name"
      tag="transition-group"
      ghost-class="border"
      @start="dragStart"
      @end="dragEnd"
    >
      <template #item="{ element }">
        <template-item :info="element" />
      </template>
    </draggable>
  </div>
</template>

<script lang="ts" setup>
import { listProps } from '@/composition/props';
import { TemplateInfo } from '@/typings/editor';
import Draggable from 'vuedraggable';
import { curDragTemplate } from './state';
import TemplateItem from './TemplateItem.vue';

const props = defineProps({
  items: listProps<TemplateInfo>(),
});

const emit = defineEmits<{
  /** 开始进行拖拽操作 */
  (event: 'start'): void;
}>();

function dragStart(data) {
  const fromItem = data.item as HTMLElement;
  const source = JSON.parse(fromItem.dataset.source || '{}') as TemplateInfo;
  curDragTemplate.value = source;
  emit('start');
}

function dragEnd() {
  setTimeout(() => {
    curDragTemplate.value = undefined; // drop处理完后清空，用于识别其他情况的拖拽
  }, 100);
}
</script>
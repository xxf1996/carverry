<template>
  <div class="grid grid-cols-3">
    <draggable
      :list="items"
      :group="{ name: 'source', pull: 'clone', put: false }"
      item-key="meta.path"
      tag="transition-group"
      ghost-class="border"
      @start="dragStart"
      @end="dragEnd"
    >
      <template #item="{ element }">
        <div
          class="p-1 text-center h-20 break-all hover:border hover:border-blue-200 cursor-move"
          :data-source="JSON.stringify(element.meta)"
        >
          <p>暂无预览</p>
          <p class="font-medium">
            {{ element.config.title || element.meta.name }}
          </p>
        </div>
      </template>
    </draggable>
  </div>
</template>

<script lang="ts" setup>
import { listProps } from '@/composition/props';
import { MaterialItem } from '@/typings/editor';
import Draggable from 'vuedraggable';
import { curDragComponent } from './state';

const props = defineProps({
  items: listProps<MaterialItem>(),
});
const emit = defineEmits<{
  /** 开始进行拖拽操作 */
  (event: 'start'): void;
}>();

function dragStart(data) {
  // const ev = data.originalEvent as DragEvent;
  const fromItem = data.item as HTMLElement;
  const source = JSON.parse(fromItem.dataset.source || '{}') as MaterialItem['meta'];
  curDragComponent.value = source;
  emit('start');
}

function dragEnd() {
  setTimeout(() => {
    curDragComponent.value = undefined; // drop处理完后清空，用于识别其他情况的拖拽
  }, 100);
}
</script>
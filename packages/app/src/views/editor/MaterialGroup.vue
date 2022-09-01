<template>
  <div class="grid grid-cols-2 gap-2">
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
        <component-item
          :cover="element.cover"
          :title="element.config.title || element.meta.name"
          :desc="element.config.desc"
          :source="element.meta"
        />
      </template>
    </draggable>
  </div>
</template>

<script lang="ts" setup>
import { listProps } from '@/composition/props';
import { MaterialItem } from '@/typings/editor';
import Draggable from 'vuedraggable';
import { curDragComponent } from './state';
import ComponentItem from './ComponentItem.vue';

const props = defineProps({
  items: listProps<MaterialItem>(),
});
const emit = defineEmits<{
  /** 开始进行拖拽操作 */
  (event: 'start'): void;
}>();

function dragStart(data) {
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

<style lang="scss">
.material-group {
  &__cover {
    .el-image__inner {
      @apply inline-block max-w-150 w-auto;
    }
  }
}
</style>

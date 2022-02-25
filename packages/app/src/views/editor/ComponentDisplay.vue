<template>
  <div>
    <draggable
      :list="componentList"
      :group="{ name: 'source', pull: 'clone', put: false }"
      item-key="path"
      tag="transition-group"
      ghost-class="border"
      @start="dragStart"
      @end="dragEnd"
    >
      <template #item="{ element }">
        <p
          class="m-1 p-1"
          :data-source="JSON.stringify(element)"
        >
          {{ element.name }}
          <span
            v-if="element.doc.description"
            class="text-neutral-500"
          >
            ({{ element.doc.description }})
          </span>
        </p>
      </template>
    </draggable>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';
import Draggable from 'vuedraggable';
import { componentInfo, curDragComponent } from './state';
import { ComponentMeta } from '@/typings/editor';

const componentList = ref(Object.values(componentInfo.value));

function dragStart(data) {
  // const ev = data.originalEvent as DragEvent;
  const fromItem = data.item as HTMLElement;
  const source = JSON.parse(fromItem.dataset.source || '{}') as Required<ComponentMeta>;
  curDragComponent.value = source;
}

function dragEnd() {
  setTimeout(() => {
    curDragComponent.value = undefined; // drop处理完后清空，用于识别其他情况的拖拽
  }, 100);
}
watch(componentInfo, () => {
  componentList.value = Object.values(componentInfo.value);
});
</script>

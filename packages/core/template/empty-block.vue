<template>
  <div
    ref="containerRef"
    style="padding: 8px;"
    @slot-append.stop="slotAppend"
  >
    空白的配置，请先拖拽添加一个初始的容器组件
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { initSlotContainer, changeConfig } from '@carverry/app/src/plugins';
import { SlotAppendEvent } from '@carverry/app/src/typings/editor';

const containerRef = ref<HTMLElement>();

function slotAppend(e: CustomEvent<SlotAppendEvent>) {
  changeConfig('', e.detail.meta);
}

onMounted(() => {
  if (!containerRef.value) {
    return;
  }
  initSlotContainer(containerRef.value, true);
});
</script>

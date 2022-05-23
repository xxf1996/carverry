<template>
  <div
    ref="containerRef"
    class="empty-block"
    @slot-append.stop="slotAppend"
  >
    空白的配置，请先拖拽添加一个初始的容器组件
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { initSlotContainer, changeConfig } from '@carverry/helper';
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

<style scoped>
.empty-block {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  font-size: 28px;
  font-weight: 500;
}
</style>

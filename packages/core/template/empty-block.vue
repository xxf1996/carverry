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
import { initSlotContainer } from 'carverry';

const containerRef = ref<HTMLElement>();

function slotAppend(e: CustomEvent) {
  console.log(e);
}

onMounted(() => {
  if (!containerRef.value) {
    return;
  }
  initSlotContainer(containerRef.value, true);
});
</script>

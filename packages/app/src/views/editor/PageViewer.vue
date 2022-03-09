<template>
  <iframe
    class="w-full h-full"
    :src="previewUrl"
    title="预览"
    crossorigin="anonymous"
  />
</template>

<script lang="ts" setup>
import { curDragComponent } from './state';

const previewUrl = 'http://localhost:3000/carverry-preview';

function containerDragover(e: DragEvent) {
  e.preventDefault();
  if (!e.currentTarget || !curDragComponent.value) {
    return;
  }
  e.stopPropagation(); // 停止冒泡
  (e.currentTarget as HTMLElement).classList.add('bg-brand-300', 'bg-opacity-30');
}

function containerDrop(e: DragEvent) {
  e.preventDefault();
  e.stopPropagation(); // 停止冒泡
  e.currentTarget?.dispatchEvent(new Event('slot-append', {
    cancelable: true,
    bubbles: true,
  }));
  console.log('containerDrop');
}

function containerDragenter(e: DragEvent) {
  if (!e.currentTarget || !curDragComponent.value) {
    return;
  }
  e.stopPropagation(); // 停止冒泡
  (e.currentTarget as HTMLElement).classList.add('bg-brand-300', 'bg-opacity-30');
}

function containerDragleave(e: DragEvent) {
  if (!e.currentTarget || !curDragComponent.value) {
    return;
  }
  e.stopPropagation(); // 停止冒泡
  (e.currentTarget as HTMLElement).classList.remove('bg-brand-300', 'bg-opacity-30');
}

</script>

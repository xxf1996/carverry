<template>
  <div
    ref="container"
    class="w-full h-full"
    @dragover="containerDragover"
    @drop="containerDrop"
    @dragenter="containerDragenter"
    @dragleave="containerDragleave"
  >
    <!-- 拖拽组件时，iframe进行指针事件穿透，避免阻断事件传递 -->
    <iframe
      class="w-full h-full"
      :class="dragging ? 'pointer-events-none' : ''"
      :src="previewUrl"
      title="预览"
    />
  </div>
</template>

<script lang="ts" setup>
import { curDragComponent, dragging } from './state';
import { SocketInit, SocketEvent, SocketDragover, SocketDrop } from '@carverry/core/typings/server';
import { ref, watch } from 'vue';

const previewUrl = 'http://localhost:3000/carverry-preview';
const ws = new WebSocket('ws://localhost:3366');
const container = ref<HTMLDivElement>();
let wsLoaded = false;

function sendMessage(message: SocketEvent) {
  if (!wsLoaded) {
    return;
  }
  // console.log(message);
  ws.send(JSON.stringify(message));
}

function getPosition(e: DragEvent) {
  if (!container.value) {
    return {
      x: 0,
      y: 0,
    };
  }
  return {
    x: e.x - container.value.offsetLeft,
    y: e.y - container.value.offsetTop,
  };
}

ws.onopen = () => {
  wsLoaded = true;
  const data: SocketInit = {
    type: 'init',
    id: 'app',
  };
  sendMessage(data);
};
ws.onerror = (e) => {
  console.log(e);
};
ws.onclose = () => {
  wsLoaded = false;
};

function containerDragover(e: DragEvent) {
  e.preventDefault();
  if (!e.currentTarget || !curDragComponent.value) {
    return;
  }
  e.stopPropagation(); // 停止冒泡
  const pos = getPosition(e);
  const data: SocketDragover = {
    type: 'dragover',
    id: 'app',
    ...pos,
  };
  sendMessage(data);
  // (e.currentTarget as HTMLElement).classList.add('bg-brand-300', 'bg-opacity-30');
}

function containerDrop(e: DragEvent) {
  e.preventDefault();
  e.stopPropagation(); // 停止冒泡
  if (!curDragComponent.value) {
    return;
  }
  const pos = getPosition(e);
  const data: SocketDrop = {
    type: 'drop',
    id: 'app',
    ...pos,
    meta: curDragComponent.value,
  };
  sendMessage(data);
  // e.currentTarget?.dispatchEvent(new Event('slot-append', {
  //   cancelable: true,
  //   bubbles: true,
  // }));
  // console.log('containerDrop');
}

function containerDragenter(e: DragEvent) {
  if (!e.currentTarget || !curDragComponent.value) {
    return;
  }
  e.stopPropagation(); // 停止冒泡
  // (e.currentTarget as HTMLElement).classList.add('bg-brand-300', 'bg-opacity-30');
}

function containerDragleave(e: DragEvent) {
  if (!e.currentTarget || !curDragComponent.value) {
    return;
  }
  e.stopPropagation(); // 停止冒泡
  // (e.currentTarget as HTMLElement).classList.remove('bg-brand-300', 'bg-opacity-30');
}

watch(dragging, (val) => {
  if (!val && curDragComponent.value) {
    const data: SocketDrop = {
      type: 'drop',
      id: 'app',
      x: -1,
      y: -1,
      meta: curDragComponent.value,
    }; // 拖拽结束后也要通知一下，避免保持dragover状态
    sendMessage(data);
  }
});

</script>

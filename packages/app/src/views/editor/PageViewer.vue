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
import { blockOption, curDragComponent, dragging } from './state';
import { SocketInit, SocketEvent, SocketDragover, SocketDrop, SocketConfigChange } from '@carverry/core/typings/server';
import { ComponentOption  } from '@/typings/editor';
import type { ComponentDoc } from 'vue-docgen-api';
import { ref, watch } from 'vue';

const previewUrl = 'http://localhost:3000/carverry-preview';
const ws = new WebSocket('ws://localhost:3366');
const container = ref<HTMLDivElement>();
let wsLoaded = false;

/**
 * 获取一个组件的初始配置
 * @param path 组件路径
 * @param doc 组件文档信息
 */
function getInitOption(path: string, key: string, doc: ComponentDoc): ComponentOption {
  const option: ComponentOption = {
    path,
    key,
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

function changeConfig(message: SocketConfigChange) {
  if (message.key && message.slot) {
    // 正常插入
  } else if (!message.key) { // 初始容器插入
    const option = getInitOption(message.meta.path, '', message.meta.doc);
    blockOption.value = option;
  }
}

function sendMessage(message: SocketEvent) {
  if (!wsLoaded) {
    return;
  }
  // console.log(message);
  ws.send(JSON.stringify(message));
}

function handleMessage(message: SocketEvent) {
  console.log(message);
  switch (message.type) {
    case 'config-change':
      changeConfig(message);
      break;
    default:
      break;
  }
}

/**
 * 获取鼠标相对于预览区原点的坐标
 */
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
ws.onmessage = (e) => {
  const message: SocketEvent = JSON.parse(e.data);
  handleMessage(message);
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

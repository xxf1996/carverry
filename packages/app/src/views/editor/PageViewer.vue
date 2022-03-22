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
    <div
      v-if="showHover"
      class="fixed border border-dashed border-green-400 pointer-events-none transition-all"
      :style="hoverStyle"
    />
  </div>
</template>

<script lang="ts" setup>
import { blockOption, curBlock, curDragComponent, curEditKey, dragging, getOptionByKey, updateOptionKey } from './state';
import { SocketInit, SocketEvent, SocketDragover, SocketDrop, SocketConfigChange, SocketSlotChange, SocketHover } from '@carverry/core/typings/server';
import { ComponentOption  } from '@/typings/editor';
import type { ComponentDoc } from 'vue-docgen-api';
import { onMounted, ref, watch } from 'vue';

const previewUrl = 'http://localhost:3000/carverry-preview';
const ws = new WebSocket('ws://localhost:3366');
const container = ref<HTMLDivElement>();
const showHover = ref(false);
const hoverStyle = ref({
  width: '0px',
  height: '0px',
  top: '0px',
  left: '0px',
  backgroundColor: 'rgba(45, 178, 112, 0.05)',
});
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
  if (message.key !== undefined && message.slot) { // 正常插入
    const parent = getOptionByKey(blockOption.value, message.key); // 获取父级配置结点
    const childKey = `${message.slot}-0`;
    const option = getInitOption(message.meta.path, message.key ? `${message.key}-${childKey}` : childKey, message.meta.doc);
    if (message.before !== undefined) {
      parent.slots[message.slot].splice(message.before, 0, option); // 往指定索引之前插入新组件
    } else {
      parent.slots[message.slot].push(option); // 往指定容器插入新组件配置
    }
  } else if (message.key === undefined) { // 初始容器插入
    const option = getInitOption(message.meta.path, '', message.meta.doc);
    blockOption.value = option;
  }
  updateOptionKey(blockOption.value); // 更新配置树的key
}

function slotChange(message: SocketSlotChange) {
  const parent = getOptionByKey(blockOption.value, message.parent); // 获取父级配置结点
  const slot = parent.slots[message.slot];
  const curIdx = new Array(slot.length).fill(0).map((val, idx) => idx);
  if (message.newIdx > message.oldIdx) {
    curIdx.splice(message.newIdx + 1, 0, message.oldIdx);
    curIdx.splice(message.oldIdx, 1);
  } else if (message.newIdx < message.oldIdx) {
    curIdx.splice(message.newIdx, 0, message.oldIdx);
    curIdx.splice(message.oldIdx + 1, 1);
  }
  parent.slots[message.slot] = curIdx.map((idx) => slot[idx]); // 按照当前排序进行交换
  updateOptionKey(blockOption.value); // 更新配置树的key
}

function hoverContainer(message: SocketHover) {
  if (message.width < 0 || !curBlock.value || !container.value) {
    showHover.value = false;
    return;
  }
  hoverStyle.value.height = `${message.height}px`;
  hoverStyle.value.width = `${message.width}px`;
  hoverStyle.value.left = `${message.x + container.value.offsetLeft}px`;
  hoverStyle.value.top = `${message.y + container.value.offsetTop}px`;
  showHover.value = true;
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
    case 'slot-change':
      slotChange(message);
      break;
    case 'selected':
      curEditKey.value = message.key;
      break;
    case 'hover':
      hoverContainer(message);
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

onMounted(() => {
  if (!container.value) {
    return;
  }
  container.value.addEventListener('mouseleave', () => {
    showHover.value = false;
  });
});

watch(dragging, (val) => {
  if (!val) {
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

import { Nullable } from '@/typings/common';
import type { Router } from 'vue-router';
import Sortable from 'sortablejs/modular/sortable.core.esm';
import { ProjectContext } from '@carverry/core/typings/context';
import { SocketConfigChange, SocketEvent, SocketInit, SocketSlotChange } from '@carverry/core/typings/server';
import { ComponentMeta, SlotAppendEvent } from '@/typings/editor';

let curMeta: Nullable<Required<ComponentMeta>> = null;
let wsLoaded = false;
let wsInited = false;
let ws: Nullable<WebSocket> = null;
/** 是否为左侧组件进行拖拽 */
let dragging = false;

/**
 * 为目标DOM（容器）添加排序功能
 * @param target 目标DOM
 * @param slot slot名称
 */
function initSort(target: HTMLElement, slot: string) {
  // eslint-disable-next-line no-new
  const el = new Sortable(target, {
    animation: 100,
    ghostClass: 'border',
    onEnd: (ev) => {
      const parent = target.closest('[data-carverry-key]'); // 找到父级结点（配置树上的）
      if (!parent || !ws) {
        return;
      }
      const data: SocketSlotChange = {
        type: 'slot-change',
        id: 'target',
        parent: (parent as HTMLElement).dataset.carverryKey || '',
        oldIdx: ev.oldIndex,
        newIdx: ev.newIndex,
        slot,
      };
      ws.send(JSON.stringify(data));
      console.log(ev);
    },
  });
}

function containerDragover(e: DragEvent) {
  if (!dragging) {
    return;
  }
  e.preventDefault();
  if (!e.currentTarget) {
    return;
  }
  e.stopPropagation(); // 停止冒泡
  (e.currentTarget as HTMLElement).classList.add('bg-brand-300', 'bg-opacity-30');
}

function containerDrop(e: DragEvent) {
  if (!dragging) {
    return;
  }
  e.preventDefault();
  e.stopPropagation(); // 停止冒泡
  e.currentTarget?.dispatchEvent(new CustomEvent<SlotAppendEvent>('slot-append', {
    cancelable: true,
    bubbles: true,
    detail: {
      meta: curMeta,
      slot: (e.currentTarget as HTMLElement).dataset.slot || '',
    }, // 传递当前要添加的组件的元数据
  }));
  dragging = false;
  console.log('containerDrop');
}

function containerDragenter(e: DragEvent) {
  if (!dragging) {
    return;
  }
  if (!e.currentTarget) {
    return;
  }
  e.stopPropagation(); // 停止冒泡
  // TODO: 将tailwind样式替换成内联样式，减少依赖
  (e.currentTarget as HTMLElement).classList.add('bg-brand-300', 'bg-opacity-30');
}

function containerDragleave(e: DragEvent) {
  if (!dragging) {
    return;
  }
  if (!e.currentTarget) {
    return;
  }
  e.stopPropagation(); // 停止冒泡
  (e.currentTarget as HTMLElement).classList.remove('bg-brand-300', 'bg-opacity-30');
}

function emitDragEvent(target: Element, event: 'dragover' | 'dragleave' | 'dragenter' | 'drop') {
  target.dispatchEvent(new DragEvent(event, {
    bubbles: true,
    cancelable: true,
    shiftKey: false,
    altKey: false,
  }));
}

function initSocket() {
  if (wsInited) {
    return;
  }
  wsInited = true;
  ws = new WebSocket('ws://localhost:3366');
  let target: Nullable<Element> = null;
  ws.onopen = () => {
    wsLoaded = true;
    const data: SocketInit = {
      type: 'init',
      id: 'target',
    };
    ws?.send(JSON.stringify(data));
  };
  ws.onmessage = (e) => {
    const message: SocketEvent = JSON.parse(e.data);
    // console.log(message);
    // 自行触发drag相关事件（从父级窗口进行参数传递）
    switch (message.type) {
      case 'dragover':
        dragging = true;
        const curTarget = document.elementFromPoint(message.x, message.y); // hit testing，得到当前鼠标位置命中的元素
        if (curTarget && target && target !== curTarget) {
          emitDragEvent(target, 'dragleave');
          emitDragEvent(curTarget, 'dragenter');
        } else if (curTarget && target && target === curTarget) {
          emitDragEvent(target, 'dragover');
        } else if (!curTarget && target) {
          emitDragEvent(target, 'dragleave');
        } else if (!target && curTarget) {
          emitDragEvent(curTarget, 'dragenter');
        }
        target = curTarget;
        break;
      case 'drop':
        curMeta = message.meta;
        const curTarget2 = document.elementFromPoint(message.x, message.y); 
        if (curTarget2 && target && curTarget2 === target) {
          emitDragEvent(target, 'dragleave');
          emitDragEvent(target, 'drop');
        } else if (!curTarget2 && target) {
          dragging = false;
          emitDragEvent(target, 'dragleave'); // 表示从整个预览区离开了
        }
        target = null;
        break;
      default:
        break;
    }
  };
}

function initSlotEvent(target: HTMLElement, name: string) {
  target.dataset.slot = name;
  // 给slot容器加上样式
  target.classList.add('min-h-25px', 'border', 'border-neutral-50', 'border-dashed');
  // 容器拖拽交互和样式
  target.addEventListener('dragover', containerDragover);
  target.addEventListener('drop', containerDrop);
  target.addEventListener('dragenter', containerDragenter);
  target.addEventListener('dragleave', containerDragleave);
  initSort(target, name);
}

/** 初始化slot容器事件和样式 */
export function initSlotContainer(container: HTMLElement, empty = false) {
  initSocket();
  if (empty) {
    initSlotEvent(container, 'carverry-empty');
    return;
  }
  // [document.createTreeWalker() - Web API 接口参考 | MDN](https://developer.mozilla.org/zh-CN/docs/Web/API/Document/createTreeWalker)
  // [javascript - Is there a DOM API for querying comment nodes? - Stack Overflow](https://stackoverflow.com/questions/16151813/is-there-a-dom-api-for-querying-comment-nodes)
  // const walker = document.createTreeWalker(container, NodeFilter.SHOW_COMMENT, null);
  // let cur: Comment = walker.currentNode as Comment;
  // while (cur) {
  //   if (cur.textContent?.includes('@slot')) {
  //     const slotContainer = (cur as Comment).parentElement as HTMLElement;
  //     const slotName = (cur.nextElementSibling as Nullable<HTMLElement>)?.dataset.slot || 'default';
  //     initSlotEvent(slotContainer, slotName);
  //   }
  //   cur = walker.nextNode() as Comment;
  // }
  console.log(container);
  const key = container.dataset.carverryKey;
  if (key === undefined) {
    return;
  }
  const slots: HTMLElement[] = Array.from(container.querySelectorAll(`[data-carverry-parent='${key}']`)); // 精准查找当前结点中的所有slot子结点
  const slotContainers: HTMLElement[] = [];
  slots.forEach((el) => {
    if (!el.parentElement || slotContainers.includes(el.parentElement)) {
      return;
    }
    slotContainers.push(el.parentElement);
    initSlotEvent(el.parentElement, el.dataset.carverrySlot || ''); // 初始化slot容器（默认假设所有的slot都是放在某个区域/容器里的）
  });
}

export async function addCarverryRoute(router: Router) {
  const data = await fetch('http://localhost:3344/context', {
    method: 'get',
  }).then((res) => res.json() as Promise<ProjectContext>);
  // const source = [data.root, data.sourceDir].join('/');
  const output = [data.root, data.pageOutDir].join('/');
  const cacheDir = `${output.split(data.root)[1]}/.cache/index.vue`; // 相对路径（相对于根目录）
  router.addRoute({
    path: '/carverry-preview',
    name: 'CarverryPreview',
    /* @vite-ignore */
    component: () => import(cacheDir),
  });
  setTimeout(() => {
    router.push({
      name: 'CarverryPreview',
    });
  }, 1000);
}

/**
 * 根据drop交互改变配置
 * @param slot 当前drop命中的slot名称
 * @param meta 拖拽组件的元数据
 * @param key 捕获drop事件的组件所在配置树中的key
 * @returns 
 */
export function changeConfig(slot: string, meta: Required<ComponentMeta>, key?: string) {
  if (!wsLoaded || !ws) {
    return;
  }
  const data: SocketConfigChange = {
    type: 'config-change',
    id: 'target',
    key,
    slot,
    meta,
  };
  ws.send(JSON.stringify(data)); // 向可视化应用上报配置变化
}

export function changeSlotOrder(key: string, )
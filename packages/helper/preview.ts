import type { Nullable } from '@carverry/app/src/typings/common';
import type { Router } from 'vue-router';
import Sortable from 'sortablejs/modular/sortable.core.esm';
import type { ProjectContext } from '@carverry/core/typings/context';
import type { SocketConfigChange, SocketEvent, SocketHover, SocketInit, SocketSelected, SocketSlotChange } from '@carverry/core/typings/server';
import type { ComponentMeta, SlotAppendEvent, TemplateInfo } from '@carverry/app/src/typings/editor';

/** 当前拖拽插入的组件元数据 */
let curMeta: Nullable<Required<ComponentMeta>> = null;
/** 当前拖拽插入的模板数据 */
let curTemplate: Nullable<TemplateInfo> = null;
/** websocket是否已经建立连接 */
let wsLoaded = false;
/** websocket事件是否初始化 */
let wsInited = false;
/** websocket实例 */
let ws: Nullable<WebSocket> = null;
/** 是否为左侧组件进行拖拽 */
let dragging = false;
/** 当前鼠标x位置（相对于iframe） */
let curX = 0;
/** 当前鼠标y位置（相对于iframe） */
let curY = 0;
let contextInfo: Nullable<ProjectContext> = null;
let contextQueue: Promise<ProjectContext>[] = [];

/** 隐藏插入位置的引导条 */
function hideBar() {
  const bar = document.getElementById('carverry-bar');
  if (!bar) {
    return;
  }
  bar.style.display = 'none';
}

async function getContext() {
  if (contextInfo) {
    return contextInfo;
  }
  if (contextQueue.length > 0) {
    return contextQueue[0]; // 从请求队列直接返回promise，避免组件过多时引起的大量请求，毫无必要
  }
  /** 清空上下文信息后的第一次请求 */
  const firstReq = fetch('http://localhost:3344/context', {
    method: 'get',
  }).then((res) => res.json() as Promise<ProjectContext>).then((info) => {
    contextInfo = info;
    contextQueue = [];
    return info;
  });
  contextQueue.push(firstReq);
  return firstReq;
}

/**
 * 为目标DOM（容器）添加排序功能
 * @param target 目标DOM
 * @param slot slot名称
 */
function initSort(target: HTMLElement, slot: string) {
  // eslint-disable-next-line no-new
  new Sortable(target, {
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

/**
 * 添加拖拽命中样式
 * @param target 目标容器
 */
function addDropStyle(target: HTMLElement) {
  target.style.backgroundColor = 'rgb(209, 234, 252)';
}

function removeDropStyle(target: HTMLElement) {
  target.style.backgroundColor = '';
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
  addDropStyle(e.currentTarget as HTMLElement);
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
      meta: curMeta || curTemplate,
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
  hideBar();
  e.stopPropagation(); // 停止冒泡
  addDropStyle(e.currentTarget as HTMLElement);
}

function containerDragleave(e: DragEvent) {
  if (!dragging) {
    return;
  }
  if (!e.currentTarget) {
    return;
  }
  e.stopPropagation(); // 停止冒泡
  removeDropStyle(e.currentTarget as HTMLElement);
}

function emitDragEvent(target: Element, event: 'dragover' | 'dragleave' | 'dragenter' | 'drop') {
  target.dispatchEvent(new DragEvent(event, {
    bubbles: true,
    cancelable: true,
    shiftKey: false,
    altKey: false,
  }));
}

function initMouseEvent() {
  let prevSelected: Nullable<HTMLElement> = null;
  let prevHovered: Nullable<HTMLElement> = null;
  // 监听mousemove显示hover的组件区域
  window.addEventListener('mousemove', (e) => {
    if (dragging || !ws) { // 拖拽组件时不触发
      return;
    }
    const hitTarget = document.elementFromPoint(e.x, e.y);
    if (!hitTarget) {
      return;
    }
    const hitContainer = hitTarget.closest('[data-carverry-key]') as Nullable<HTMLElement>;
    const data: SocketHover = {
      type: 'hover',
      id: 'target',
      x: 0,
      y: 0,
      width: -1,
      height: -1,
    };
    if (!hitContainer || hitContainer === prevSelected) { // 已经选中的组件不再显示hover状态
      prevHovered = null;
      ws.send(JSON.stringify(data));
      return;
    }
    data.carverryKey = hitContainer.dataset.carverryKey;
    if (hitContainer === prevHovered) {
      return;
    }
    prevHovered = hitContainer;
    const rect = hitContainer.getBoundingClientRect();
    data.x = rect.x;
    data.y = rect.y;
    data.width = rect.width;
    data.height = rect.height;
    ws.send(JSON.stringify(data));
  });
  window.addEventListener('mousedown', (e) => {
    if (e.button !== 0) { // 仅限左键
      return;
    }
    const hitTarget = document.elementFromPoint(e.x, e.y);
    if (!hitTarget || !ws) {
      return;
    }
    const hitContainer = hitTarget.closest('[data-carverry-key]');
    if (!hitContainer) {
      return;
    }
    // const selectedContainer = document.body.querySelector('[data-carverry-selected]');
    if (prevSelected && prevSelected !== hitContainer) {
      prevSelected.style.border = 'none';
      // delete prevSelected.dataset.carverrySelected;
    }
    (hitContainer as HTMLElement).style.border = '1px solid lightcoral';
    // (hitContainer as HTMLElement).dataset.carverrySelected = '';
    prevSelected = hitContainer as HTMLElement;
    const key = (hitContainer as HTMLElement).dataset.carverryKey || '';
    const data: SocketSelected = {
      type: 'selected',
      id: 'target',
      key,
    };
    ws.send(JSON.stringify(data));
  });
}

/** 初始化websocket */
function initSocket() {
  if (wsInited) {
    return;
  }
  initMouseEvent();
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
    // 自行触发drag相关事件（从父级窗口进行参数传递）
    switch (message.type) {
      case 'dragover':
        curX = message.x;
        curY = message.y;
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
        curX = message.x;
        curY = message.y;
        curMeta = message.meta || null;
        curTemplate = message.template || null;
        const curTarget2 = document.elementFromPoint(message.x, message.y);
        if (curTarget2 && target && curTarget2 === target) {
          emitDragEvent(target, 'dragleave');
          emitDragEvent(target, 'drop');
        } else if (!curTarget2 && target) {
          emitDragEvent(target, 'dragleave'); // 表示从整个预览区离开了
          dragging = false;
        } else {
          dragging = false;
        }
        target = null;
        hideBar();
        break;
      case 'hoverByKey': // 从配置树节点获取真实预览节点的信息，伪造hover事件，进行hover同步
        const targetNode = document.body.querySelector(`[data-carverry-key="${message.carverryKey}"]`) as HTMLElement;
        if (!targetNode) {
          break;
        }
        targetNode.scrollIntoView(); // 将目标节点滚动至可视区域
        const rect = targetNode.getBoundingClientRect();
        const data: SocketHover = {
          type: 'hover',
          id: 'target',
          carverryKey: message.carverryKey,
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
        }; // 伪造对应配置节点的hover
        ws.send(JSON.stringify(data));
        break;
      default:
        break;
    }
  };
}

/**
 * 初始化slot容器相关事件
 * @param target 容器DOM
 * @param name slot名称
 * @param empty 是否为空的容器（即目前没有子组件）
 */
function initSlotEvent(target: HTMLElement, name: string, empty: boolean) {
  target.dataset.slot = name;
  // 给slot容器加上样式
  target.style.minHeight = '25px';
  target.style.border = '1px dashed rgb(97 100 103)';
  // target.classList.add('min-h-25px', 'border', 'border-neutral-50', 'border-dashed');
  if (empty) { // 空的容器才需要直接的拖拽插入处理（因为不需要精准插入）
    // 容器拖拽交互和样式
    target.addEventListener('dragover', containerDragover);
    target.addEventListener('drop', containerDrop);
    target.addEventListener('dragenter', containerDragenter);
    target.addEventListener('dragleave', containerDragleave);
  } else {
    initSort(target, name); // 非空容器则添加子组件之间的拖拽排序交互处理
  }
}

/** 非空容器内的精准位置插入相关事件处理 */
function initBlockInsert() {
  /** 之前命中的容器内组件 */
  let prevTarget: Nullable<HTMLElement> = null;
  /** 命中组件对应的DOMRect */
  let prevRect: Nullable<DOMRect> = null;
  const barWidth = 5;
  const barHalfWidth = barWidth / 2;
  document.body.addEventListener('dragover', () => {
    const hitTarget = document.elementFromPoint(curX, curY) as Nullable<HTMLElement>;
    if (!hitTarget || hitTarget.dataset.carverryEmpty) {
      prevTarget = null;
      return;
    }
    /** 最近命中的组件节点 */
    const closestTarget = hitTarget.closest('[data-carverry-child]') as Nullable<HTMLElement>;
    if (!closestTarget) {
      return;
    }
    const targetRect = prevTarget === closestTarget && prevRect ? prevRect : closestTarget.getBoundingClientRect();
    prevTarget = closestTarget;
    prevRect = targetRect;
    const left = curX - targetRect.left;
    const right = targetRect.right - curX;
    const top = curY - targetRect.top;
    const bottom = targetRect.bottom - curY;
    /** 距离边框的最近距离 */
    const minDist = Math.min(left, right, top, bottom);
    let originX = 0;
    let originY = 0;
    let width = 0;
    let height = 0;
    let bar = document.getElementById('carverry-bar');
    const curIdx = Number(closestTarget.dataset.carverryChild);
    let insertBefore = 0;
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'carverry-bar';
      bar.style.position = 'fixed';
      bar.style.backgroundColor = 'rgb(37, 99, 235)';
      bar.style.zIndex = '9999';
      document.body.appendChild(bar);
    }
    // 根据鼠标距离命中目标DOMRect的最近边框是哪个，决定插入的位置和方向
    if (minDist === left) {
      width = barWidth;
      height = targetRect.height + barWidth;
      originX = targetRect.left - barWidth;
      originY = targetRect.top - barHalfWidth;
      insertBefore = curIdx;
    } else if (minDist === right) {
      width = barWidth;
      height = targetRect.height + barWidth;
      originX = targetRect.right;
      originY = targetRect.top - barHalfWidth;
      insertBefore = curIdx + 1;
    } else if (minDist === top) {
      height = barWidth;
      width = targetRect.width + barWidth;
      originX = targetRect.left - barHalfWidth;
      originY = targetRect.top - barWidth;
      insertBefore = curIdx;
    } else if (minDist === bottom) {
      height = barWidth;
      width = targetRect.width + barWidth;
      originX = targetRect.left - barHalfWidth;
      originY = targetRect.bottom;
      insertBefore = curIdx + 1;
    }
    // 插入位置引导条样式
    bar.style.display = 'block';
    bar.style.left = `${originX}px`;
    bar.style.top = `${originY}px`;
    bar.style.width = `${width}px`;
    bar.style.height = `${height}px`;
    bar.dataset.carverryBefore = insertBefore.toString(); // 保存插入位置
  });
  document.body.addEventListener('drop', (e) => {
    e.stopImmediatePropagation(); // 避免多次触发
    const bar = document.getElementById('carverry-bar');
    const hitTarget = document.elementFromPoint(curX, curY) as Nullable<HTMLElement>;
    if (!hitTarget || hitTarget.dataset.carverryEmpty || !bar || (!curMeta && !curTemplate) || !ws) { // 判断是否有数据（模板或组件）
      prevTarget = null;
      return;
    }
    const closestTarget = hitTarget.closest('[data-carverry-child]') as Nullable<HTMLElement>;
    if (!closestTarget || closestTarget !== prevTarget) { // 检测是否跟之前的命中目标一致
      prevTarget = null;
      return;
    }
    // 根据拖拽数据区分结构
    const data: SocketConfigChange = curMeta ? {
      type: 'config-change',
      insertType: 'component',
      id: 'target',
      key: closestTarget.dataset.carverryParent,
      slot: closestTarget.dataset.carverrySlot || 'default',
      meta: curMeta,
      before: Number(bar.dataset.carverryBefore),
    } : {
      type: 'config-change',
      insertType: 'template',
      id: 'target',
      key: closestTarget.dataset.carverryParent,
      slot: closestTarget.dataset.carverrySlot || 'default',
      template: curTemplate,
      before: Number(bar.dataset.carverryBefore),
    };
    ws.send(JSON.stringify(data));
    // 清空历史数据
    curMeta = null;
    curTemplate = null;
  });
}

/** 初始化slot容器事件和样式 */
export async function initSlotContainer(container: HTMLElement, empty = false) {
  const context = await getContext();
  initSocket();
  if (empty) {
    initSlotEvent(container, 'carverry-empty', true);
    return;
  }
  if (context.readOnly) {
    return; // 只读模式下拖拽交互都不需要了
  }
  // [document.createTreeWalker() - Web API 接口参考 | MDN](https://developer.mozilla.org/zh-CN/docs/Web/API/Document/createTreeWalker)
  // [javascript - Is there a DOM API for querying comment nodes? - Stack Overflow](https://stackoverflow.com/questions/16151813/is-there-a-dom-api-for-querying-comment-nodes)
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
    initSlotEvent(el.parentElement, el.dataset.carverrySlot || '', !!el.dataset.carverryEmpty); // 初始化slot容器（默认假设所有的slot都是放在某个区域/容器里的）
  });
  initBlockInsert();
}

/**
 * 注册carverry预览路由
 * @param router 路由实例
 * @param afterInit 注册完路由后的事件钩子，默认会直接跳转到预览页；如果要增加自定义路由参数可以自行使用钩子；
 * @param entry 预览路由入口文件，默认为`/src/blocks/.cache/index.vue`
 */
export async function addCarverryRoute(router: Router, afterInit?: () => void, entry = '/src/blocks/.cache/index.vue') {
  let inited = false;
  /** 默认处理 */
  const defaultCb = () => {
    setTimeout(() => {
      router.push({
        name: 'CarverryPreview',
      });
    }, 100);
  };
  const cb = afterInit || defaultCb;
  router.addRoute({
    path: '/carverry-preview',
    name: 'CarverryPreview',
    component: () => import(/* @vite-ignore */entry),
  }); // 动态注册预览路由
  router.beforeEach(async (to, from, next) => {
    if (to.path.includes('carverry-preview') && !inited) {
      inited = true;
      cb(); // 第一次进入预览页时执行回调
    }
    next();
  });
}

/**
 * 根据drop交互改变配置
 * @param slot 当前drop命中的slot名称
 * @param meta 拖拽组件的元数据
 * @param key 捕获drop事件的组件所在配置树中的key
 * @returns 
 */
export function changeConfig(slot: string, meta: Required<ComponentMeta> | TemplateInfo, key?: string) {
  if (!wsLoaded || !ws) {
    return;
  }
  const data: SocketConfigChange = 'path' in meta ? {
    type: 'config-change',
    insertType: 'component',
    id: 'target',
    key,
    slot,
    meta,
  } : {
    type: 'config-change',
    insertType: 'template',
    id: 'target',
    key,
    slot,
    template: meta,
  };
  ws.send(JSON.stringify(data)); // 向可视化应用上报配置变化
}

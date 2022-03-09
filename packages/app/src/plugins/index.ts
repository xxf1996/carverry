import { Nullable } from '@/typings/common';
import type { Router } from 'vue-router';
import Sortable from 'sortablejs/modular/sortable.core.esm';
import { ProjectContext } from '../../../core/typings/context';

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
      target.dispatchEvent(new CustomEvent('slot-change', {
        detail: {
          oldIdx: ev.oldIndex,
          newIdx: ev.newIndex,
          slot,
        },
        cancelable: true,
        bubbles: true,
      }));
      console.log(ev);
    },
  });
}

function emitEvent(name: string) {
  return (e: DragEvent) => {
    console.log(e);
    e.stopPropagation();
    e.preventDefault();
    e.currentTarget?.dispatchEvent(new CustomEvent(name, {
      cancelable: true,
      bubbles: true,
    }));
  };
}

function containerDragover(e: DragEvent) {
  console.log(e);
  e.preventDefault();
  if (!e.currentTarget) {
    return;
  }
  e.stopPropagation(); // 停止冒泡
  (e.currentTarget as HTMLElement).classList.add('bg-brand-300', 'bg-opacity-30');
}

function containerDrop(e: DragEvent) {
  console.log(e);
  e.preventDefault();
  e.stopPropagation(); // 停止冒泡
  e.currentTarget?.dispatchEvent(new Event('slot-append', {
    cancelable: true,
    bubbles: true,
  }));
  console.log('containerDrop');
}

function containerDragenter(e: DragEvent) {
  console.log(e);
  if (!e.currentTarget) {
    return;
  }
  e.stopPropagation(); // 停止冒泡
  (e.currentTarget as HTMLElement).classList.add('bg-brand-300', 'bg-opacity-30');
}

function containerDragleave(e: DragEvent) {
  console.log(e);
  if (!e.currentTarget) {
    return;
  }
  e.stopPropagation(); // 停止冒泡
  (e.currentTarget as HTMLElement).classList.remove('bg-brand-300', 'bg-opacity-30');
}

function initSlotEvent(target: HTMLElement, name: string) {
  // TODO: 也许可以通过伪造事件来传递drag/drop事件，只不过需要自行判断事件类型。有没有高效的hit test方法？
  window.addEventListener('mousemove', () => {
    target.dispatchEvent(new DragEvent('dragover', {
      bubbles: true,
      cancelable: true,
      shiftKey: false,
      altKey: false,
    }));
  });
  target.dataset.slot = name;
  // 给slot容器加上样式
  target.classList.add('min-h-25px', 'border', 'border-neutral-50', 'border-dashed');
  // 容器拖拽交互和样式
  // target.addEventListener('dragover', emitEvent('carverry-dragover'));
  // target.addEventListener('drop', emitEvent('carverry-drop'));
  // target.addEventListener('dragenter', emitEvent('carverry-dragenter'));
  // target.addEventListener('dragleave', emitEvent('carverry-dragleave'));
  target.addEventListener('dragover', containerDragover);
  target.addEventListener('drop', containerDrop);
  target.addEventListener('dragenter', containerDragenter);
  target.addEventListener('dragleave', containerDragleave);
  initSort(target, name);
}

/** 初始化slot容器事件和样式 */
export function initSlotContainer(container: HTMLElement, empty = false) {
  if (empty) {
    initSlotEvent(container, 'carverry-empty');
    return;
  }
  // [document.createTreeWalker() - Web API 接口参考 | MDN](https://developer.mozilla.org/zh-CN/docs/Web/API/Document/createTreeWalker)
  // [javascript - Is there a DOM API for querying comment nodes? - Stack Overflow](https://stackoverflow.com/questions/16151813/is-there-a-dom-api-for-querying-comment-nodes)
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_COMMENT, null);
  let cur: Comment = walker.currentNode as Comment;
  while (cur) {
    if (cur.textContent?.includes('@slot')) {
      const slotContainer = (cur as Comment).parentElement as HTMLElement;
      const slotName = (cur.nextElementSibling as Nullable<HTMLElement>)?.dataset.slot || 'default';
      initSlotEvent(slotContainer, slotName);
    }
    cur = walker.nextNode() as Comment;
  }
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
    component: () => import(cacheDir),
  });
  setTimeout(() => {
    router.push({
      name: 'CarverryPreview',
    });
  }, 1000);
}
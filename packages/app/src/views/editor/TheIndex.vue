<template>
  <div>
    <el-container class="h-screen">
      <el-aside width="360px">
        <div class="flex items-center gap-2">
          <!-- <el-select v-model="pageContainer">
            <el-option
              v-for="(page, key) in pages"
              :key="key"
              :label="page.name"
              :value="key"
            />
          </el-select> -->
          <el-button size="small">
            重置
          </el-button>
          <el-button
            type="primary"
            size="small"
            :disabled="generating"
            :loading="generating"
            @click="generatePage('test')"
          >
            生成页面
          </el-button>
        </div>
        <h5>操作</h5>
        <div class="flex items-center m-2">
          <el-button
            type="danger"
            size="mini"
            plain
            :disabled="!curEditKey"
            @click="removeComponent"
          >
            移除组件
          </el-button>
        </div>
        <!-- TODO: 组件/模板信息分类，支持setup方式增加组件描述（异步组件ref默认skip了）； -->
        <h5>组件/模板区</h5>
        <component-display />
        <h5>属性区</h5>
        <template-meta />
      </el-aside>
      <el-main class="p-0">
        <!-- TODO: 优化异步组件重载逻辑 -->
        <!-- <template-render
          v-if="templateLoaded"
          ref="renderRef"
          :meta="activedPageMeta"
          :option="pageOption"
          render-key=""
          @update-target="initSlotContainer"
          @update-template="updateTemplate"
        /> -->
        <page-viewer />
      </el-main>
    </el-container>
  </div>
</template>

<script lang="ts" setup>
import {
  computed, nextTick, ref, watch,
} from 'vue';
import Sortable from 'sortablejs/modular/sortable.core.esm.js';
import { ElMessageBox } from 'element-plus';
import CommonPage from '@/template/CommonPage.vue';
import TemplateRender from './TemplateRender.vue';
import TemplateMeta from './TemplateMeta.vue';
import {
  curDragComponent,
  curEditKey, curOption, getOptionByKey, pageOption, updateComponnetInfo, updateFileInfo, updateOptionKey,
} from './state';
import ComponentDisplay from './ComponentDisplay.vue';
import { Nullable } from '@/typings/common';
import PageViewer from './PageViewer.vue';

const renderRef = ref<typeof TemplateRender>();
const templateLoaded = ref(true);
const generating = ref(false);

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

/** 初始化slot容器事件和样式 */
function initSlotContainer() {
  if (!renderRef.value) {
    return;
  }
  // [document.createTreeWalker() - Web API 接口参考 | MDN](https://developer.mozilla.org/zh-CN/docs/Web/API/Document/createTreeWalker)
  // [javascript - Is there a DOM API for querying comment nodes? - Stack Overflow](https://stackoverflow.com/questions/16151813/is-there-a-dom-api-for-querying-comment-nodes)
  const walker = document.createTreeWalker(renderRef.value.$el, NodeFilter.SHOW_COMMENT, null);
  let cur: Comment = walker.currentNode as Comment;
  while (cur) {
    if (cur.textContent?.includes('@slot')) {
      const slotContainer = (cur as Comment).parentElement as HTMLDivElement;
      const slotName = (cur.nextElementSibling as Nullable<HTMLElement>)?.dataset.slot || 'default';
      slotContainer.dataset.slot = slotName;
      // 给slot容器加上样式
      slotContainer.classList.add('min-h-25px', 'border', 'border-neutral-50', 'border-dashed');
      // 容器拖拽交互和样式
      slotContainer.addEventListener('dragover', containerDragover);
      slotContainer.addEventListener('drop', containerDrop);
      slotContainer.addEventListener('dragenter', containerDragenter);
      slotContainer.addEventListener('dragleave', containerDragleave);
      initSort(slotContainer, slotName);
    }
    cur = walker.nextNode() as Comment;
  }
}

function updateTemplate() {
  templateLoaded.value = false;
  nextTick(() => {
    templateLoaded.value = true;
  });
}

/** 从配置中移除当前选中组件 */
async function removeComponent() {
  await ElMessageBox.confirm('此操作将移除当前组件，是否继续？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  });
  const paths = curEditKey.value.split('-');
  if (paths.length < 2 || !renderRef.value) {
    return;
  }
  renderRef.value.toggleSelect(); // 选中最外层
  nextTick(() => {
    const parentPath = paths.slice(0, -2).join('-'); // 找到父级节点路径
    const selfPaths = paths.slice(-2);
    const slotName = selfPaths[0];
    const slotIdx = Number(selfPaths[1]);
    const parent = getOptionByKey(pageOption.value, parentPath);
    parent.slots[slotName].splice(slotIdx, 1); // 移除配置
    updateOptionKey(pageOption.value);
  });
}

async function generatePage(name: string) {
  generating.value = true;
  // 相同配置会被缓存，需要实时最新
  await import(`./${Date.now()}/page-generator?option=${JSON.stringify({
    data: pageOption.value,
    name,
  })}`).finally(() => {
    generating.value = false;
  });
}

watch(curEditKey, (val) => {
  curOption.value = getOptionByKey(pageOption.value, val);
}, { immediate: true });
updateFileInfo();
updateComponnetInfo();
// initPageOption();
</script>

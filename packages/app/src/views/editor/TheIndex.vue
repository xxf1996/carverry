<template>
  <div>
    <el-container class="h-screen">
      <el-aside width="360px">
        <p>当前编辑Block为：{{ curBlock || '暂无' }}</p>
        <div class="flex items-center gap-2 px-1 py-2">
          <el-button
            size="small"
            type="primary"
            @click="showLoad = true;"
          >
            加载Block
          </el-button>
          <el-button
            size="small"
            @click="showAdd = true;"
          >
            新建Block
          </el-button>
          <el-button
            type="primary"
            size="small"
            :disabled="generating"
            :loading="generating"
            @click="generatePage('test')"
          >
            生成源码
          </el-button>
          <el-button size="small">
            重置
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
        <page-viewer />
      </el-main>
    </el-container>
    <drawer-container
      v-model="showLoad"
      title="加载Block"
      @ok="selectBlock"
      @cancel="showLoad = false;"
    >
      <el-select v-model="loadedBlock">
        <el-option
          v-for="block in blocks"
          :key="block"
          :value="block"
          :label="block"
        />
      </el-select>
    </drawer-container>
    <drawer-container
      v-model="showAdd"
      title="新建Block"
      @ok="addBlock"
      @cancel="showAdd = false;"
    >
      <el-input
        v-model="blockName"
        placeholder="请输入Block名称"
      />
    </drawer-container>
  </div>
</template>

<script lang="ts" setup>
import {
  nextTick, ref, watch,
} from 'vue';
import { ElMessageBox } from 'element-plus';
import TemplateMeta from './TemplateMeta.vue';
import {
  curEditKey, curOption, getOptionByKey, blockOption, updateComponnetInfo, updateFileInfo, updateOptionKey, updatePreview, curBlock, initBlockOption, getBlocks, getBlockConfig,
} from './state';
import ComponentDisplay from './ComponentDisplay.vue';
import PageViewer from './PageViewer.vue';
import DrawerContainer from '@/components/DrawerContainer.vue';
import { debouncedWatch } from '@vueuse/core';

const generating = ref(false);
const showLoad = ref(false);
const showAdd = ref(false);
const loadedBlock = ref('');
const blocks = ref<string[]>([]);
const blockName = ref('');

async function updateBlocks() {
  const data = await getBlocks();
  blocks.value = data;
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
    const parent = getOptionByKey(blockOption.value, parentPath);
    parent.slots[slotName].splice(slotIdx, 1); // 移除配置
    updateOptionKey(blockOption.value);
  });
}

async function generatePage(name: string) {
  generating.value = true;
  // 相同配置会被缓存，需要实时最新
  await import(`./${Date.now()}/page-generator?option=${JSON.stringify({
    data: blockOption.value,
    name,
  })}`).finally(() => {
    generating.value = false;
  });
}

async function addBlock() {
  if (!blockName.value) {
    return;
  }
  await fetch('/editor-api/block', {
    method: 'post',
    body: JSON.stringify({
      name: blockName.value,
    }),
  });
  updateBlocks();
  curBlock.value = blockName.value;
  initBlockOption();
  showAdd.value = false;
}

async function selectBlock() {
  if (!loadedBlock.value) {
    return;
  }
  curBlock.value = loadedBlock.value;
  const curConfig = await getBlockConfig(loadedBlock.value);
  if (curConfig.path) {
    blockOption.value = curConfig;
  } else {
    initBlockOption();
  }
  showLoad.value = false;
}

updateFileInfo();
updateComponnetInfo();
updatePreview();
updateBlocks();

watch(curEditKey, (val) => {
  curOption.value = getOptionByKey(blockOption.value, val);
}, { immediate: true });

debouncedWatch(() => [curBlock.value, blockOption.value], () => {
  updatePreview();
}, { debounce: 200 });
</script>

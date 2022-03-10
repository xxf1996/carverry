<template>
  <div>
    <el-container class="h-screen">
      <el-aside width="360px">
        <div class="flex items-center gap-2 px-1 py-2">
          <el-button
            size="small"
            type="primary"
          >
            加载Block
          </el-button>
          <el-button size="small">
            新建Block
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
  </div>
</template>

<script lang="ts" setup>
import {
  nextTick, ref, watch,
} from 'vue';
import { ElMessageBox } from 'element-plus';
import TemplateMeta from './TemplateMeta.vue';
import {
  curEditKey, curOption, getOptionByKey, blockOption, updateComponnetInfo, updateFileInfo, updateOptionKey, updatePreview,
} from './state';
import ComponentDisplay from './ComponentDisplay.vue';
import PageViewer from './PageViewer.vue';

const templateLoaded = ref(true);
const generating = ref(false);

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

watch(curEditKey, (val) => {
  curOption.value = getOptionByKey(blockOption.value, val);
}, { immediate: true });
updateFileInfo();
updateComponnetInfo();
updatePreview();
// initPageOption();
</script>

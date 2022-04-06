<template>
  <div>
    <el-container class="h-screen">
      <el-aside width="360px">
        <h3
          v-if="projectContext?.readOnly"
          class="text-red-500"
        >
          【只读模式】
        </h3>
        <p>当前编辑Block为：<span class="font-bold">{{ curBlock || '暂无' }}</span></p>
        <div class="flex items-center flex-wrap gap-2 px-1 py-2">
          <el-button
            size="small"
            type="primary"
            @click="showLoad = true;"
          >
            加载Block
          </el-button>
          <el-button
            size="small"
            :disabled="projectContext?.readOnly"
            @click="showAdd = true;"
          >
            新建Block
          </el-button>
          <!-- TODO：模板就是配置的复用（分为本地和纯远程/更通用的模板）【优先级高】 -->
          <el-button
            :disabled="projectContext?.readOnly"
            size="small"
          >
            保存为模板
          </el-button>
          <el-button
            type="primary"
            size="small"
            :disabled="generating || !curBlock || projectContext?.readOnly"
            :loading="generating"
            @click="generateBlock"
          >
            生成源码
          </el-button>
          <!-- 重新加载右侧页面 -->
          <el-button size="small" @click="reloadPreview">
            重新加载
          </el-button>
          <el-button
            size="small"
            :disabled="projectContext?.readOnly"
          >
            重置
          </el-button>
        </div>
        <h5>组件操作</h5>
        <div class="p-2">
          <p class="break-all">
            <span class="font-medium">选中组件：</span>
            {{ `${curMeta?.doc.displayName || curMeta?.name || '暂未获取到组件名称'}（${curMeta?.doc.description || '暂无描述'}）` }}
          </p>
          <p class="break-all">
            <span class="font-medium">组件标识符：</span>
            {{ `${curMeta?.path || '暂无标识符'}` }}
          </p>
          <div class="flex items-center gap-2">
            <el-button
              type="danger"
              size="small"
              :disabled="!curEditKey || projectContext?.readOnly"
              @click="removeComponent"
            >
              移除组件
            </el-button>
          </div>
        </div>
        <!-- 只读模式下不需要编辑相关的功能 -->
        <template v-if="!projectContext?.readOnly">
          <h5>物料库</h5>
          <el-button
            class="m-2"
            @click="showMaterial = true;"
          >
            打开物料库面板
          </el-button>
          <h5>属性区</h5>
          <template-meta />
        </template>
      </el-aside>
      <el-main class="p-0">
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
    <material-displayer v-model:visible="showMaterial" />
  </div>
</template>

<script lang="ts" setup>
import {
  nextTick, ref, watch,
} from 'vue';
import { ElMessageBox, ElMessage } from 'element-plus';
import TemplateMeta from './TemplateMeta.vue';
import {
  curEditKey, curOption, getOptionByKey, blockOption, updateLocalComponents, updateFileInfo, updateOptionKey, updatePreview, curBlock, initBlockOption, getBlocks, getBlockConfig, generateCode, curMeta, updatePackages, updateContext, projectContext, pageBus,
} from './state';
import PageViewer from './PageViewer.vue';
import DrawerContainer from '@/components/DrawerContainer.vue';
import { debouncedWatch } from '@vueuse/core';
import MaterialDisplayer from './MaterialDisplayer.vue';

const generating = ref(false);
const showLoad = ref(false);
const showAdd = ref(false);
const loadedBlock = ref('');
const blocks = ref<string[]>([]);
const blockName = ref('');
const showMaterial = ref(false);

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
  if (paths.length < 2 || !curBlock.value) {
    return;
  }
  nextTick(() => {
    const parentPath = paths.slice(0, -2).join('-'); // 找到父级节点路径
    const selfPaths = paths.slice(-2);
    const slotName = selfPaths[0];
    const slotIdx = Number(selfPaths[1]);
    const parent = getOptionByKey(blockOption.value, parentPath);
    parent.slots[slotName].splice(slotIdx, 1); // 移除配置
    curEditKey.value = '';
    updateOptionKey(blockOption.value);
  });
}

async function generateBlock() {
  generating.value = true;
  await generateCode().finally(() => {
    generating.value = false;
  });
  ElMessage.success(`区块【${curBlock.value}】的源码已生成！`);
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

/** 重新加载右侧预览页 */
function reloadPreview() {
  pageBus.emit('reload');
}

updateFileInfo();
updateLocalComponents();
updatePackages();
updatePreview();
updateBlocks();
updateContext();

watch(curEditKey, (val) => {
  curOption.value = getOptionByKey(blockOption.value, val);
}, { immediate: true });

debouncedWatch(() => [curBlock.value, blockOption.value], () => {
  updatePreview();
}, { debounce: 400, deep: true });
</script>

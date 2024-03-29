<template>
  <div>
    <el-container class="h-screen">
      <el-header class="flex items-center h-11 bg-white border-b border-b-gray-300">
        <app-logo />
        <el-tooltip
          v-if="readOnly"
          content="只读模式下不能进行任何编辑操作，只能查看Block及其结构"
          :show-after="200"
        >
          <h3
            class="text-blue-500 text-sm pl-2 cursor-pointer"
          >
            【只读模式】
          </h3>
        </el-tooltip>
        <div class="ml-auto flex items-center gap-2">
          <el-tooltip
            content="查看操作文档"
            :show-after="200"
          >
            <el-button
              size="small"
              @click="toDoc"
            >
              <el-icon
                color="#3c6"
                :size="16"
              >
                <document />
              </el-icon>
            </el-button>
          </el-tooltip>
          <!-- 只读模式下不需要编辑相关的功能 -->
          <template v-if="!readOnly">
            <el-tooltip
              content="物料库"
              :show-after="200"
            >
              <el-button
                size="small"
                @click="showMaterial = true;"
              >
                <el-icon
                  color="#f39"
                  :size="16"
                >
                  <Box />
                </el-icon>
              </el-button>
            </el-tooltip>
            <el-tooltip
              content="本地模板"
              :show-after="200"
            >
              <el-button
                size="small"
                @click="showTemplate = true;"
              >
                <el-icon
                  color="#39f"
                  :size="16"
                >
                  <Tickets />
                </el-icon>
              </el-button>
            </el-tooltip>
            <el-tooltip
              content="移除当前选中的组件"
              :show-after="200"
            >
              <el-button
                class="m-4"
                type="danger"
                size="small"
                plain
                :disabled="!curEditKey || readOnly"
                @click="removeComponent"
              >
                <el-icon
                  :size="16"
                >
                  <Delete />
                </el-icon>
              </el-button>
            </el-tooltip>
          </template>
          <!-- block选择 -->
          <el-tooltip
            content="从项目中已有的Block进行选择，然后加载"
            :show-after="200"
          >
            <el-select
              v-model="loadedBlock"
              placeholder="请选择一个Block"
              size="small"
              @change="selectBlock"
            >
              <el-option
                v-for="block in blocks"
                :key="block"
                :value="block"
                :label="block"
              />
            </el-select>
          </el-tooltip>
          <!-- undo/redo操作 -->
          <el-tooltip
            v-if="!readOnly"
            content="Undo"
            :show-after="100"
          >
            <el-button
              size="small"
              :disabled="!blockCanUndo"
              @click="blockUndo"
            >
              <el-icon :size="16">
                <refresh-left />
              </el-icon>
            </el-button>
          </el-tooltip>
          <el-tooltip
            v-if="!readOnly"
            content="Redo"
            :show-after="100"
          >
            <el-button
              size="small"
              :disabled="!blockCanRedo"
              @click="blockRedo"
            >
              <el-icon :size="16">
                <refresh-right />
              </el-icon>
            </el-button>
          </el-tooltip>
          <el-tooltip
            content="重新加载右侧预览页面（相当于单独刷新iframe）"
            :show-after="100"
          >
            <!-- 重新加载右侧页面 -->
            <el-button
              type="primary"
              size="small"
              @click="reloadPreview"
            >
              重新加载
            </el-button>
          </el-tooltip>
          <el-tooltip
            content="更新本地项目信息，主要用于刷新项目文件等本地信息"
            :show-after="100"
          >
            <el-button
              size="small"
              :disabled="updateLoading"
              :loading="updateLoading"
              @click="updateProjectInfo"
            >
              更新项目信息
            </el-button>
          </el-tooltip>
          <el-tooltip
            v-if="!readOnly"
            content="将当前选中组件配置保存为一个本地模板"
            :show-after="100"
          >
            <el-button
              :disabled="!curOption"
              type="primary"
              size="small"
              @click="toSaveTemplate"
            >
              保存为模板
            </el-button>
          </el-tooltip>
          <el-tooltip
            v-if="!readOnly"
            content="创建一个新的Block"
            :show-after="100"
          >
            <el-button
              size="small"
              @click="showAdd = true;"
            >
              新建Block
            </el-button>
          </el-tooltip>
          <el-tooltip
            v-if="!readOnly"
            content="将当前Block的配置转换为对应的Vue源码"
            :show-after="100"
          >
            <el-button
              type="primary"
              size="small"
              :disabled="generating || !curBlock"
              :loading="generating"
              @click="generateBlock"
            >
              生成源码
            </el-button>
          </el-tooltip>
        </div>
      </el-header>
      <!-- 不知道为啥flex-1不能自动填充高度，主要是子级元素高度超过不会控制 -->
      <el-container class="content">
        <el-main class="p-2">
          <page-viewer />
        </el-main>
        <el-aside
          class="bg-white border-l border-l-gray-300 overflow-y-auto"
          width="360px"
        >
          <component-bread />
          <option-tree />
          <!-- 只读模式下不需要编辑相关的功能 -->
          <template v-if="!readOnly">
            <template-meta />
          </template>
        </el-aside>
      </el-container>
    </el-container>
    <material-displayer v-model:visible="showMaterial" />
    <template-displayer v-model:visible="showTemplate" />
    <block-form v-model:visible="showAdd" />
    <template-form v-model:visible="showAddTemplate" />
  </div>
</template>

<script lang="ts" setup>
import {
  nextTick, ref, watch,
} from 'vue';
import { ElMessageBox, ElMessage } from 'element-plus';
import TemplateMeta from './TemplateMeta.vue';
import {
  curEditKey, curOption, getOptionByKey, blockOption, updateLocalComponents, updateFileInfo, updateOptionKey, updatePreview, curBlock, initBlockOption, blocks, getBlockConfig, generateCode, updatePackages, updateContext, readOnly, pageBus, blockCanRedo, blockCanUndo, blockRedo, blockUndo, updateBlocks, updateTemplates, blockClear,
} from './state';
import PageViewer from './PageViewer.vue';
import { debouncedWatch } from '@vueuse/core';
import MaterialDisplayer from './MaterialDisplayer.vue';
import { useRouter } from 'vue-router';
import { RefreshLeft, RefreshRight, Box, Tickets, Delete, Document } from '@element-plus/icons-vue';
import BlockForm from './BlockForm.vue';
import TemplateForm from './TemplateForm.vue';
import TemplateDisplayer from './TemplateDisplayer.vue';
import ComponentBread from './ComponentBread.vue';
import OptionTree from './option-tree/OptionTree.vue';
import AppLogo from './AppLogo.vue';

/** 源码生成中 */
const generating = ref(false);
/** 是否显示新增block弹窗 */
const showAdd = ref(false);
/** 显示本地模板列表 */
const showTemplate = ref(false);
const showAddTemplate = ref(false);
const loadedBlock = ref('');
/** 显示物料列表弹窗 */
const showMaterial = ref(false);
/** 项目信息更新中 */
const updateLoading = ref(false);
const router = useRouter();

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
    curEditKey.value = undefined;
    updateOptionKey(blockOption.value);
  });
}

/** 生成block配置对应的源码文件 */
async function generateBlock() {
  generating.value = true;
  await generateCode().finally(() => {
    generating.value = false;
  });
  ElMessage.success(`区块【${curBlock.value}】的源码已生成！`);
}

/**
 * 跳转到指定block
 */
function toBlock(name: string) {
  router.push({
    name: 'Editor',
    query: {
      block: name,
    },
  });
}

/** 选中某个block */
async function selectBlock(val: string) {
  if (!val) {
    return;
  }
  toBlock(val);
}

/** 根据当前block初始化相关信息 */
async function updateBlockOption() {
  const curConfig = await getBlockConfig(curBlock.value);
  if (curConfig.path) {
    blockOption.value = curConfig;
  } else {
    initBlockOption();
  }
  nextTick(() => {
    blockClear(); // 切换block要重新开始记录历史，否则会回退到不是同一个block的配置的情况
  });
}

/** 重新加载右侧预览页 */
function reloadPreview() {
  pageBus.emit('reload');
}

/** 更新项目相关的元数据 */
async function updateProjectInfo() {
  updateLoading.value = true;
  await Promise.all([
    updateFileInfo(),
    updateLocalComponents(),
    updatePackages(),
    updateBlocks(),
    updateContext(),
    updateTemplates(),
  ]).finally(() => {
    updateLoading.value = false;
  });
}

function toSaveTemplate() {
  if (!curOption.value?.path) {
    ElMessage.warning('请先选中一个组件区域！');
    return;
  }
  showAddTemplate.value = true;
}

function toDoc() {
  window.open('https://github.com/xxf1996/carverry/blob/master/docs/basic.md', '_blank');
}

updateProjectInfo();
updatePreview();

watch(curEditKey, (val) => {
  if (val === undefined) {
    curOption.value = undefined; // 同步清空
    return;
  }
  curOption.value = getOptionByKey(blockOption.value, val);
}, { immediate: true });

watch(curBlock, (val) => {
  updateBlockOption();
  loadedBlock.value = val;
  curEditKey.value = undefined; // 切换block要清空选中状态
}, {
  immediate: true,
});

debouncedWatch(() => [curBlock.value, blockOption.value], () => {
  updatePreview();
}, { debounce: 400, deep: true });
</script>

<style lang="scss" scoped>
.content {
  height: calc(100vh - 44px);
}
</style>

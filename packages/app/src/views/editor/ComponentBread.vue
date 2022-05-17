<template>
  <div class="editor-header">
    <el-breadcrumb
      v-if="breads.length > 0"
      :separator-icon="ArrowRight"
    >
      <!-- TODO: 点击快速选择对应节点，hover时同步显示节点区域 -->
      <el-breadcrumb-item
        v-for="(bread, idx) in breads"
        :key="bread.key"
        class="component-bread__item"
        :class="idx === breads.length - 1 ? 'component-bread__selected' : ''"
      >
        {{ getComponentName(bread.path) }}
      </el-breadcrumb-item>
    </el-breadcrumb>
    <p v-else>
      暂未选中组件
    </p>
  </div>
</template>

<script lang="ts" setup>
// 当前选中组件对应的层级面包屑

import { ComponentOption } from '@/typings/editor';
import { computed } from 'vue';
import { ArrowRight } from '@element-plus/icons-vue';
import { blockOption, componentMap, curEditKey, getOptionByKey } from './state';

const breads = computed<ComponentOption[]>(() => {
  const res: ComponentOption[] = [];

  if (typeof curEditKey.value !== 'string') {
    return res;
  }

  res.push(blockOption.value); // 加入根节点

  const paths = curEditKey.value.split('-');

  if (paths.length % 2 !== 0) { // 正常情况应该为偶数（slot-index是成对出现的）
    return res;
  }

  let curRoot = blockOption.value;

  for (let i = 0; i < paths.length; i += 2) {
    const curKey = `${paths[i]}-${paths[i + 1]}`;
    const curNode = getOptionByKey(curRoot, curKey);
    res.push(curNode);
    curRoot = curNode;
  }

  return res;
});

function getComponentName(componentPath: string): string {
  const meta = componentMap.value[componentPath];

  if (/^[^.]+\.vue$/.test(meta.name)) {
    return meta.doc.displayName;
  }

  return meta.name;
}
</script>

<style lang="scss" scoped>
.component-bread {
  &__item {
    @apply text-xs leading-5 transition-colors;

    &:not(.component-bread__selected):hover {
      @apply cursor-pointer;

      :deep(.el-breadcrumb__inner) {
        @apply text-red-300;
      }
    }
  }

  &__selected {
    @apply font-extrabold text-sm;

    :deep(.el-breadcrumb__inner) { // 深度选择器的使用：https://stackoverflow.com/questions/48032006/how-do-i-use-deep-or-or-v-deep-in-vue-js
      @apply text-red-400;
    }
  }
}
</style>

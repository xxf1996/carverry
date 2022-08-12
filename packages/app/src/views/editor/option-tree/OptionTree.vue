<template>
  <div>
    <h5>配置树</h5>
    <el-tree
      :data="optionTree"
      :props="{ disabled: 'isSlot' }"
      default-expand-all
    >
      <template #default="{ data }">
        <span
          v-if="data.isSlot"
          class="font-bold"
        >{{ data.label }}</span>
        <span v-else>{{ data.label }}</span>
      </template>
    </el-tree>
  </div>
</template>

<script lang="ts" setup>
import { watch } from 'vue';
import { optionTree } from './state';

// TODO: 同步节点hover状态
// TODO: 更好的分辨节点类型（渲染，UI）
// TODO: 在配置树内进行插入操作，且同步插入交互占位显示

watch(optionTree, (val) => {
  console.log('配置树', val);
});
</script>
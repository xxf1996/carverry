<template>
  <div class="editor-header option-tree flex items-center justify-between">
    <span>配置树</span>
    <el-switch
      v-model="showTree"
      size="small"
    />
  </div>
  <div
    v-show="showTree"
    class="py-2 px-1"
  >
    <el-tree
      :data="optionTree"
      :props="{ disabled: 'isSlot', class: () => 'option-tree__item' }"
      default-expand-all
    >
      <template #default="{ data }">
        <span
          v-if="data.isSlot"
          class="font-bold"
        >{{ data.label }}</span>
        <span
          v-else
          :class="curHoverKey && curHoverKey === data.key ? 'option-tree__hovered' : ''"
          @mouseenter="mouseEnter(data.key)"
          @mouseleave="mouseLeave()"
        >{{ data.label }}</span>
      </template>
    </el-tree>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';
import { optionTree } from './state';
import { curHoverKey } from '../state';
import { hoverBus } from '../event-bus';

// TODO: 更好的分辨节点类型（渲染，UI）
// TODO: 在配置树内进行插入操作，且同步插入交互占位显示

const showTree = ref(false);

function mouseEnter(key: string) {
  curHoverKey.value = key;
  hoverBus.emit('hover');
}

function mouseLeave() {
  curHoverKey.value = undefined;
}

watch(optionTree, (val) => {
  console.log('配置树', val);
});
watch(curHoverKey, (val) => {
  console.log('curHoverKey', val);
});
</script>

<style lang="scss">
.option-tree {
  &__item {
    :deep(.el-tree-node__content):hover {
      @apply bg-none;
    }
  }

  &__hovered {
    @apply px-1 border border-dashed border-green-400;
    background-color: rgba(45, 178, 112, 0.05); // 保持跟配置节点hover一样的样式
  }
}
</style>
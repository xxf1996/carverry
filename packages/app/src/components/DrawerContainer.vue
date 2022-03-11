<template>
  <el-drawer
    v-model="proxyVal"
    custom-class="drawer-container"
    v-bind="$props"
    :close-on-click-modal="false"
  >
    <div class="flex-grow overflow-auto">
      <!-- @slot 抽屉主体内容 -->
      <slot name="default" />
    </div>
    <div class="flex items-center justify-end flex-shrink-0 gap-2 px-4 pt-2 pb-4">
      <el-button
        :loading="loading"
        :disabled="loading"
        @click="$emit('cancel')"
      >
        {{ cancelName }}
      </el-button>
      <el-button
        type="primary"
        :loading="loading"
        :disabled="loading"
        @click="$emit('ok')"
      >
        {{ confirmName }}
      </el-button>
    </div>
  </el-drawer>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElDrawer } from 'element-plus';
import { boolProps, proxyProp, stringProps } from '@/composition/props';

/** 抽屉通用容器组件，对`el-drawer`组件的简单封装，用于相同样式排版的快速使用；其它属性直接继承`el-drawer`组件； */
export default defineComponent({
  name: 'DrawerContainer',
  extends: ElDrawer,
  props: {
    /** 底部按钮加载状态 */
    loading: boolProps(),
    /** `v-model`，抽屉显示状态 */
    modelValue: boolProps(),
    /** 底部确认按钮名称 */
    confirmName: stringProps('确认'),
    /** 底部取消按钮名称 */
    cancelName: stringProps('取消'),
  },
  emits: ['cancel', 'ok'],
  setup(props) {
    const proxyVal = proxyProp(props, 'modelValue');

    return {
      proxyVal,
    };
  },
});
</script>

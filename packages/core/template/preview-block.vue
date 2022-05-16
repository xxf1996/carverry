<template>
  <some-component
    ref="containerRef"
    data-carverry-key="key"
    @slot-append.stop="slotAppend"
    @slot-change.stop="slotAppend"
  >
    <!-- 注入slot（子级结点）-->
    <template #demo>
      <!-- 通过carverry-parent字段来表明所属的父级；通过carverry-slot来表明所属的slot；通过上述两者来精准定位某个key下的slot插入，而且querySelector时也能缩小范围； -->
      <slot-demo-0
        data-carverry-parent="key"
        data-carverry-slot="demo"
        data-carverry-child="0"
      />
    </template>
    <template #empty>
      <div
        data-carverry-parent="key"
        data-carverry-empty="true"
        data-carverry-slot="demo"
      >
        这是空的slot，显示名称或备注
      </div>
    </template>
  </some-component>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { initSlotContainer, changeConfig } from '@carverry/helper';
import { SlotAppendEvent } from '@carverry/app/src/typings/editor';

const containerRef = ref<HTMLElement>();
const props = defineProps({
  carverryParent: {
    type: String,
    default: '',
  },
  carverrySlot: {
    type: String,
    default: '',
  },
  carverryChild: {
    type: String,
    default: '0',
  },
}); // 组件的dataset设置不一定有作用

function slotAppend(e: CustomEvent<SlotAppendEvent>) {
  changeConfig(e.detail.slot, e.detail.meta, 'key');
}

onMounted(() => {
  if (!containerRef.value) {
    return;
  }
  let el: HTMLElement = containerRef.value.$el || containerRef.value;
  if (el.nodeName === '#text' && el.nextElementSibling) {
    el = el.nextElementSibling as HTMLElement;
  }
  el.dataset.carverryKey = 'key'; // 双重保险，避免有些组件吞了attribute设置
  el.dataset.carverryParent = props.carverryParent;
  el.dataset.carverrySlot = props.carverrySlot;
  el.dataset.carverryChild = props.carverryChild;
  initSlotContainer(el);
});
</script>

<style>
*[data-carverry-key]:hover {
  background-color: rgba(82, 185, 245, 0.4);
}
</style>

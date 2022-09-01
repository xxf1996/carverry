<template>
  <hljs-component
    class="ts-type"
    language="typescript"
    :code="code"
  />
</template>

<script lang="ts" setup>
import 'highlight.js/styles/github.css';
import hljs from 'highlight.js/lib/core';
import hljsTS from 'highlight.js/lib/languages/typescript';
import hljsVue from '@highlightjs/vue-plugin';
import { computed } from 'vue';

hljs.registerLanguage('typescript', hljsTS);
const hljsComponent = hljsVue.component;

interface Props {
  code: string
  /** 最大宽度 */
  maxWidth?: number
  /** 是否自动换行 */
  autoLine?: boolean
}

const props = defineProps<Props>();

const maxWidthStyle = computed(() => props.maxWidth ? `${props.maxWidth}px` : 'none');
const overflowStyle = computed(() => props.autoLine ? 'auto' : 'hidden');
</script>

<style lang="scss" scoped>
.ts-type {
  margin: 0;

  :deep(code) {
    max-width: v-bind(maxWidthStyle);
    padding: 0; // highlightjs默认渲染有很大的padding
    margin-left: auto;
    font-size: 12px;
    overflow-x: v-bind(overflowStyle);
    background: transparent;
  }
}
</style>

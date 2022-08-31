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

hljs.registerLanguage('typescript', hljsTS);
const hljsComponent = hljsVue.component;

// TODO: 优化类型的高亮显示

defineProps<{
  code: string
}>();
</script>

<style lang="scss" scoped>
.ts-type {
  :deep(code) {
    padding: 0; // highlightjs默认渲染有很大的padding
    font-size: 12px;
  }
}
</style>

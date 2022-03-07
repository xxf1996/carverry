<template>
  <iframe
    class="w-full h-full"
    :src="previewUrl"
    title="预览"
  />
</template>

<script lang="ts" setup>
const previewUrl = 'http://localhost:3000/carverry-preview';
</script>

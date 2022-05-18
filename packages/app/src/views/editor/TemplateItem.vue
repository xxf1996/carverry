<template>
  <el-card
    class="hover:cursor-move"
    shadow="never"
    :body-style="{ padding: '0px' }"
    :data-source="JSON.stringify(info)"
  >
    <template #header>
      <div>
        <h3>{{ info.name }}</h3>
        <p class="text-neutral-300">
          {{ info.desc || '暂无描述' }}
        </p>
      </div>
    </template>
    <img
      v-if="info.cover"
      class="w-full h-40 object-center object-cover"
      :src="info.cover"
      alt="预览图"
    >
    <div
      v-else
      class="bg-gray-200 h-40 flex items-center justify-center"
    >
      <span>暂无预览</span>
    </div>
  </el-card>
</template>

<script lang="ts" setup>
import { objectProps } from '@/composition/props';
import { TemplateInfo } from '@/typings/editor';

const props = defineProps({
  info: objectProps<TemplateInfo>(),
});
</script>
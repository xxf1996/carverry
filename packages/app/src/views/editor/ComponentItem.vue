<template>
  <el-card
    class="hover:cursor-move"
    shadow="never"
    :body-style="{ padding: '0px' }"
    :data-source="JSON.stringify(source)"
  >
    <template #header>
      <div class="overflow-hidden">
        <h3>{{ title }}</h3>
        <el-tooltip
          placement="top"
          :content="desc || '暂无描述'"
          :show-after="200"
        >
          <p class="text-neutral-300 overflow-hidden whitespace-nowrap overflow-ellipsis">
            {{ desc || '暂无描述' }}
          </p>
        </el-tooltip>
      </div>
    </template>
    <img
      v-if="cover"
      class="w-full h-30 object-center object-cover"
      :src="cover"
      alt="预览图"
    >
    <div
      v-else
      class="bg-gray-200 h-30 flex items-center justify-center"
    >
      <span>暂无预览</span>
    </div>
  </el-card>
</template>

<script lang="ts" setup>
import { objectProps, stringProps } from '@/composition/props';
import { ComponentMeta } from '@/typings/editor';

const props = defineProps({
  /** 预览封面 */
  cover: stringProps(),
  /** 标题 */
  title: stringProps(),
  /** 描述 */
  desc: stringProps(),
  source: objectProps<Required<ComponentMeta>>(),
});
</script>
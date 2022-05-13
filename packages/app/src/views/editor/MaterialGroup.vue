<template>
  <div class="grid grid-cols-3">
    <draggable
      :list="items"
      :group="{ name: 'source', pull: 'clone', put: false }"
      item-key="meta.path"
      tag="transition-group"
      ghost-class="border"
      @start="dragStart"
      @end="dragEnd"
    >
      <template #item="{ element }">
        <div
          class="flex flex-col p-1 text-center h-30 break-all hover:border hover:border-blue-200 cursor-move"
          :data-source="JSON.stringify(element.meta)"
        >
          <!-- 点击显示预览大图 -->
          <el-popover
            v-if="element.cover"
            placement="left"
            trigger="click"
            :width="600"
          >
            <template #reference>
              <el-image
                class="flex-1"
                :src="element.cover"
                fit="contain"
              />
            </template>
            <el-image
              class="w-150"
              fit="contain"
              :src="element.cover"
            />
          </el-popover>
          <p
            v-else
            class="flex-1"
          >
            暂无预览
          </p>
          <p class="font-medium">
            {{ element.config.title || element.meta.name }}
            <el-tooltip
              v-if="element.config.desc"
              :content="element.config.desc"
            >
              <el-icon class="mx-1">
                <warning />
              </el-icon>
            </el-tooltip>
          </p>
        </div>
      </template>
    </draggable>
  </div>
</template>

<script lang="ts" setup>
import { listProps } from '@/composition/props';
import { MaterialItem } from '@/typings/editor';
import Draggable from 'vuedraggable';
import { curDragComponent } from './state';
import { Warning } from '@element-plus/icons-vue';

const props = defineProps({
  items: listProps<MaterialItem>(),
});
const emit = defineEmits<{
  /** 开始进行拖拽操作 */
  (event: 'start'): void;
}>();

function dragStart(data) {
  const fromItem = data.item as HTMLElement;
  const source = JSON.parse(fromItem.dataset.source || '{}') as MaterialItem['meta'];
  curDragComponent.value = source;
  emit('start');
}

function dragEnd() {
  setTimeout(() => {
    curDragComponent.value = undefined; // drop处理完后清空，用于识别其他情况的拖拽
  }, 100);
}
</script>

<style lang="scss">
.material-group {
  &__cover {
    .el-image__inner {
      @apply inline-block max-w-150 w-auto;
    }
  }
}
</style>

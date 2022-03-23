<template>
  <div>
    <div class="flex items-center p-2 gap-1">
      <span class="font-medium">本地组件：</span>
      <el-cascader
        v-model="curDir"
        class="flex-1"
        filterable
        clearable
        :props="casProps"
        :options="dirOptions"
        @change="changeDir"
      />
    </div>
    <div class="grid grid-cols-3">
      <draggable
        :list="componentList"
        :group="{ name: 'source', pull: 'clone', put: false }"
        item-key="path"
        tag="transition-group"
        ghost-class="border"
        @start="dragStart"
        @end="dragEnd"
      >
        <template #item="{ element }">
          <div
            class="p-1 text-center h-20 break-all"
            :data-source="JSON.stringify(element)"
          >
            <p>暂无预览</p>
            <p class="font-medium">
              {{ element.doc.displayName || element.name }}
              <el-tooltip
                v-if="element.doc.description"
                :content="element.doc.description"
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
  </div>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';
import Draggable from 'vuedraggable';
import { localComponents, curDragComponent } from './state';
import { ComponentLeafNode, ComponentMeta, ComponentTree } from '@/typings/editor';
import { CascaderOption, CascaderProps } from 'element-plus';
import { Warning } from '@element-plus/icons-vue';

const casProps: CascaderProps = { emitPath: false };
const componentList = ref<Required<ComponentMeta>[]>([]);
const componentDirMap = ref<Record<string, Required<ComponentMeta>[]>>({});
const curDir = ref('');
const dirOptions = ref<CascaderOption[]>([]);
const emit = defineEmits<{
  /** 开始进行拖拽操作 */
  (event: 'start'): void;
}>();

function isLeaf(node: ComponentTree | ComponentLeafNode): node is ComponentLeafNode {
  return 'path' in node;
}

function getTree(node: ComponentTree): CascaderOption[] {
  const options: CascaderOption[] = [];
  const leafs: ComponentLeafNode[] = [];
  const others: {
    node: ComponentTree;
    key: string;
  }[] = [];
  for (const key of Object.keys(node.children)) {
    const child = node.children[key];
    if (isLeaf(child)) {
      leafs.push(child);
    } else {
      others.push({
        node: child,
        key,
      });
    }
  }

  if (leafs.length > 0) {
    const paths = leafs[0].path.split('/').slice(0, -1);
    paths.push('*');
    const dir = paths.join('/');
    options.push({
      label: '*',
      value: dir,
      leaf: true,
    });
    componentDirMap.value[dir] = leafs.map((leaf) => localComponents.value.componentMap[leaf.path]);
  }

  if (others.length > 0) {
    others.forEach((other) => {
      options.push({
        label: other.key,
        value: other.key,
        children: getTree(other.node),
      });
    });
  }

  return options;
}

function changeDir() {
  componentList.value = componentDirMap.value[curDir.value];
}

function dragStart(data) {
  // const ev = data.originalEvent as DragEvent;
  const fromItem = data.item as HTMLElement;
  const source = JSON.parse(fromItem.dataset.source || '{}') as Required<ComponentMeta>;
  curDragComponent.value = source;
  emit('start');
}

function dragEnd() {
  setTimeout(() => {
    curDragComponent.value = undefined; // drop处理完后清空，用于识别其他情况的拖拽
  }, 100);
}

watch(localComponents, (val) => {
  componentDirMap.value = {};
  dirOptions.value = getTree(val.componentTree);
  curDir.value = '';
}, { immediate: true });
</script>

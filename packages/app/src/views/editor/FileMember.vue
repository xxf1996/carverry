<template>
  <div class="flex gap-2 items-center">
    <el-cascader
      v-model="proxyFile"
      filterable
      clearable
      :props="casProps"
      :options="treeOptions"
    />
    <el-select
      v-model="proxyMember"
      filterable
      clearable
    >
      <el-option
        v-for="option in memberOptions"
        :key="option.name"
        :value="option.name"
      >
        <p class="grid grid-cols-2 gap-2 m-1 leading-5">
          <span>{{ option.name }}</span>
          <span class="text-neutral-50 text-right">{{ option.type }}</span>
        </p>
        <p
          v-if="option.desc"
          class="text-red-300 m-1 leading-5"
        >
          {{ option.desc }}
        </p>
      </el-option>
    </el-select>
  </div>
</template>

<script lang="ts" setup>
/* eslint-disable no-restricted-syntax */
import { CascaderOption, CascaderProps } from 'element-plus';
import { computed, watch } from 'vue';
import { proxyProp } from '@/composition/props';
import { fileInfo } from './state';
import { FileExportMember, FileLeafNode, FileTree } from '@/typings/editor';

function isLeaf(node: FileTree | FileLeafNode): node is FileLeafNode {
  return 'fullPath' in node;
}

function getTree(node: FileTree): CascaderOption[] {
  const options: CascaderOption[] = [];
  for (const key of Object.keys(node.children)) {
    const child = node.children[key];
    if (isLeaf(child)) {
      options.push({
        label: key,
        value: child.fullPath,
        leaf: true,
      });
    } else {
      options.push({
        label: key,
        value: key,
        children: getTree(child),
      });
    }
  }

  return options;
}

const props = defineProps<{
  file?: string;
  member?: string;
}>();
const casProps: CascaderProps = { emitPath: false };
const treeOptions = computed(() => getTree(fileInfo.value.fileTree));
const memberOptions = computed<FileExportMember[]>(() => {
  let options: FileExportMember[] = [];

  if (props.file) {
    const members = fileInfo.value.fileMap[props.file];
    options = Object.values(members);
  }

  return options;
});
const proxyFile = proxyProp(props, 'file');
const proxyMember = proxyProp(props, 'member');

watch(proxyFile, (val) => {
  console.log(val);
  proxyMember.value = '';
});
</script>

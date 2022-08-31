<template>
  <div class="flex gap-2 items-center">
    <!-- 最近使用路径快捷交互 -->
    <el-dropdown @command="selectRecent">
      <el-icon
        class="hover:cursor-pointer"
        color="#FDA50F"
        :size="16"
      >
        <clock />
      </el-icon>
      <template #dropdown>
        <el-dropdown-item disabled>
          最近使用路径
        </el-dropdown-item>
        <el-dropdown-item
          v-for="(path, idx) in recentPaths"
          :key="path"
          :divided="idx === 0"
          :command="path"
        >
          {{ path }}
        </el-dropdown-item>
      </template>
    </el-dropdown>
    <!-- 文件路径选择 -->
    <el-cascader
      v-model="proxyFile"
      filterable
      clearable
      placeholder="输入关键词或直接选择"
      size="small"
      :props="casProps"
      :options="treeOptions"
      @change="changeFile"
    />
    <!-- 文件变量选择 -->
    <el-select
      v-model="proxyMember"
      size="small"
      filterable
      clearable
      placeholder="输入关键词或直接选择"
    >
      <el-option
        v-for="option in memberOptions"
        :key="option.name"
        :value="option.name"
      >
        <p class="grid grid-cols-2 gap-2 m-1 leading-5">
          <span>{{ option.name }}</span>
          <ts-type
            class="text-right"
            :code="option.type"
          />
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
import { computed } from 'vue';
import { proxyProp } from '@/composition/props';
import { fileInfo, recentPaths, updateRecentPaths } from './state';
import { FileExportMemberV2, FileLeafNode, FileTree } from '@/typings/editor';
import { Clock } from '@element-plus/icons-vue';

function isLeaf(node: FileTree | FileLeafNode): node is FileLeafNode {
  return 'fullPath' in node;
}

/** 获取可用的逻辑文件树 */
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
const memberOptions = computed<FileExportMemberV2[]>(() => {
  let options: FileExportMemberV2[] = [];

  if (props.file) {
    const members = fileInfo.value.fileMap[props.file];
    options = Object.values(members);
  }

  return options;
});
const proxyFile = proxyProp(props, 'file');
const proxyMember = proxyProp(props, 'member');

function changeFile(val: string) {
  updateRecentPaths(val);
  proxyMember.value = '';
}

/**
 * 选中某个最近使用的路径
 */
function selectRecent(path: string) {
  proxyFile.value = path;
  changeFile(path);
}
</script>

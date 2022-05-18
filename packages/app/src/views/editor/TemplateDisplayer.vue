<template>
  <el-drawer
    v-model="proxyVisible"
    title="本地模板"
    :modal="false"
    :size="500"
  >
    <div class="p-2">
      <el-input
        v-model="keyword"
        placeholder="请输入关键词进行过滤"
        clearable
      />
    </div>
    <el-collapse
      v-model="expanded"
      class="px-2"
    >
      <el-collapse-item
        v-for="(group, key) in groups"
        :key="key"
        :title="key"
        :name="key"
      >
        <template-group
          class="p-2"
          :items="group"
          @start="proxyVisible = false;"
        />
      </el-collapse-item>
    </el-collapse>
  </el-drawer>
</template>

<script lang="ts" setup>
import { boolProps, proxyProp } from '@/composition/props';
import { TemplateInfo } from '@/typings/editor';
import { computed, ref, watch } from 'vue';
import { templates } from './state';
import TemplateGroup from './TemplateGroup.vue';

const props = defineProps({
  visible: boolProps(),
});
const emit = defineEmits<{
  (event: 'update:visible', val: boolean): void;
}>();
const keyword = ref('');
/** 已展开的分组 */
const expanded = ref<string[]>([]);
const filteredTemplates = computed(() => templates.value.filter((template) => {
  if (!keyword.value) {
    return true;
  }
  const fitName = template.name.includes(keyword.value);
  const fitDesc = template.desc && template.desc.includes(keyword.value);

  return fitName || fitDesc;
}));
const groups = computed<Record<string, TemplateInfo[]>>(() => {
  const group: Record<string, TemplateInfo[]> = {};
  const addToGroup = (type: string, info: TemplateInfo) => {
    if (group[type]) {
      group[type].push(info);
    } else {
      group[type] = [info];
    }
  };
  filteredTemplates.value.forEach((template) => {
    addToGroup(template.type || '未分类', template);
  });
  return group;
});
const proxyVisible = proxyProp(props, 'visible');

watch(groups, (val) => {
  expanded.value = Object.keys(val); // 默认展开全部分组
});
</script>
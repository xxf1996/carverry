<template>
  <div v-if="curOption">
    <p v-if="metaProps.length > 0">
      Props
    </p>
    <!-- 注意prop和event不同组件会存在同名，不应该直接用名字做key -->
    <template
      v-for="prop in metaProps"
      :key="`${curEditKey}-${prop.name}`"
    >
      <div class="flex items-center my-1 text-neutral-500">
        <span>{{ prop.description || prop.name }}</span>
        <span
          v-if="prop.description"
          class="text-red-600"
        >({{ prop.name }})</span>
        <el-tooltip
          content="开启v-model"
          placement="right"
          :show-after="200"
        >
          <el-switch
            v-model="curOption.props[prop.name].model"
            class="ml-auto"
          />
        </el-tooltip>
      </div>
      <file-member
        v-model:file="curOption.props[prop.name].path"
        v-model:member="curOption.props[prop.name].member"
      />
    </template>
    <p v-if="metaEvents.length > 0">
      Events
    </p>
    <template
      v-for="event in metaEvents"
      :key="`${curEditKey}-${event.name}`"
    >
      <p class="my-1 text-neutral-500">
        {{ event.description || event.name }}
        <span v-if="event.description">({{ event.name }})</span>
      </p>
      <file-member
        v-model:file="curOption.events[event.name].path"
        v-model:member="curOption.events[event.name].member"
      />
    </template>
  </div>
  <p
    v-else
    class="text-neutral-600 text-center"
  >
    没有数据
  </p>
</template>

<script lang="ts" setup>
import { computed, watch } from 'vue';
import { curMeta, curOption, curEditKey } from './state';
import FileMember from './FileMember.vue';

const metaProps = computed(() => curMeta.value?.doc.props || []);
const metaEvents = computed(() => curMeta.value?.doc.events || []);

watch(curOption, (val) => {
  console.log('curOption', val);
});
</script>

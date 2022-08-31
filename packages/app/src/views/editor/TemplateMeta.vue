<template>
  <div v-if="curOption">
    <div class="editor-header">
      Ref 绑定
    </div>
    <div class="template-meta__container">
      <file-member
        v-if="curOption.ref"
        v-model:file="curOption.ref.path"
        v-model:member="curOption.ref.member"
      />
    </div>
    <div
      v-if="metaProps.length > 0"
      class="editor-header"
    >
      Props
    </div>
    <div class="template-meta__container">
      <!-- 注意prop和event不同组件会存在同名，不应该直接用名字做key -->
      <template
        v-for="prop in metaProps"
        :key="`${curEditKey}-${prop.name}`"
      >
        <div class="template-meta__prop">
          <el-popover
            placement="left"
            :width="300"
            @show="updatePropType(prop.name)"
          >
            <template #reference>
              <span class="template-meta__title underline underline-offset-2 underline-dark-50">{{ prop.name }}</span>
            </template>
            <ts-type :code="propType" />
          </el-popover>
          <el-tooltip
            placement="right"
            :content="prop.description || '暂无描述'"
            :show-after="200"
          >
            <el-icon class="hover:cursor-pointer">
              <warning />
            </el-icon>
          </el-tooltip>

          <el-tooltip
            content="开启v-model"
            placement="left"
            :show-after="200"
          >
            <el-switch
              v-model="curOption.props[prop.name].model"
              class="ml-auto"
              size="small"
            />
          </el-tooltip>
        </div>
        <file-member
          v-model:file="curOption.props[prop.name].path"
          v-model:member="curOption.props[prop.name].member"
          class="template-meta__prop-item"
        />
      </template>
    </div>
    <div
      v-if="metaEvents.length > 0"
      class="editor-header"
    >
      Events
    </div>
    <div class="template-meta__container">
      <template
        v-for="event in metaEvents"
        :key="`${curEditKey}-${event.name}`"
      >
        <p class="template-meta__prop">
          <span class="template-meta__title">{{ event.name }}</span>
          <el-tooltip
            placement="right"
            :content="event.description || '暂无描述'"
            :show-after="200"
          >
            <el-icon class="hover:cursor-pointer">
              <warning />
            </el-icon>
          </el-tooltip>
        </p>
        <file-member
          v-model:file="curOption.events[event.name].path"
          v-model:member="curOption.events[event.name].member"
          class="template-meta__prop-item"
        />
      </template>
    </div>
    <div
      v-if="metaSlots.length > 0"
      class="editor-header"
    >
      Slots
    </div>
    <div class="template-meta__container">
      <template
        v-for="slot in metaSlots"
        :key="`${curEditKey}-${slot.name}`"
      >
        <div class="template-meta__prop">
          <span class="template-meta__title">{{ slot.name }}</span>
          <el-tooltip
            placement="right"
            :content="slot.description || '暂无描述'"
            :show-after="200"
          >
            <el-icon class="hover:cursor-pointer">
              <warning />
            </el-icon>
          </el-tooltip>
          <el-tooltip
            content="是否使用空的slot内容（通常是为了使用组件的默认slot内容）"
            placement="left"
            :show-after="200"
          >
            <el-switch
              v-if="curOption.slots[slot.name].length > 0"
              v-model="curOption.slots[slot.name][0].skip"
              class="ml-auto"
              size="small"
              @change="val => changeSkip(val, slot.name)"
            />
            <el-switch
              v-else
              v-model="skipState"
              class="ml-auto"
              size="small"
              @change="val => changeSkip(val, slot.name)"
            />
          </el-tooltip>
        </div>
      </template>
    </div>
  </div>
  <p
    v-else
    class="text-neutral-600 text-center"
  >
    没有数据
  </p>
</template>

<script lang="ts" setup>
import { computed, nextTick, ref, watch } from 'vue';
import { curMeta, curOption } from './state';
import FileMember from './FileMember.vue';
import { Warning } from '@element-plus/icons-vue';
import { getPropType } from '@/api';

const metaProps = computed(() => curMeta.value?.doc.props || []);
const metaEvents = computed(() => curMeta.value?.doc.events || []);
const metaSlots = computed(() => curMeta.value?.doc.slots || []);
const skipState = ref(false);
const propType = ref('');

/**
 * 处理skip筛选状态
 * @param skip 是否skip
 * @param slot slot name
 */
function changeSkip(skip: boolean, slot: string) {
  if (skip) {
    if (curOption.value.slots[slot].length === 0) { // 空的slot
      curOption.value.slots[slot] = [
        {
          skip: true,
          key: '',
          path: '',
          props: {},
          events: {},
          slots: {},
        },
      ];
    } else {
      curOption.value.slots[slot][0].skip = true;
    }
    skipState.value = false;
  } else {
    curOption.value.slots[slot] = []; // 取消skip时清空slot内容
  }
}

/** 检查当前组件元数据是否初始化，避免组件元数据结构发生变化 */
function checkMetaValid() {
  if (!curMeta.value || !curOption.value) {
    return;
  }
  if (curMeta.value.path !== curOption.value.path) {
    return;
  }
  metaProps.value.forEach((prop) => {
    if (curOption.value.props[prop.name]) {
      return;
    }
    curOption.value.props[prop.name] = {
      path: '',
      member: '',
    };
  });
  metaEvents.value.forEach((event) => {
    if (curOption.value.events[event.name]) {
      return;
    }
    curOption.value.events[event.name] = {
      path: '',
      member: '',
    };
  });
  metaSlots.value.forEach((slot) => {
    if (curOption.value.slots[slot.name]) {
      return;
    }
    curOption.value.slots[slot.name] = [];
  });
  if (!curOption.value.ref) {
    curOption.value.ref = {
      path: '',
      member: '',
    };
  }
}

async function updatePropType(prop: string) {
  if (!curMeta.value) {
    return;
  }
  propType.value = await getPropType(curMeta.value.path, prop);
}

watch(curOption, (val) => {
  console.log('curOption', val);
});
watch(curMeta, (val) => {
  console.log('curMeta', val);
  nextTick(checkMetaValid);
});
</script>

<style lang="scss" scoped>
.template-meta {
  &__container {
    @apply p-2;
  }

  &__prop {
    @apply flex items-center px-1 py-1 my-1 text-neutral-600 bg-red-50 border-l-2 border-l-red-400;
  }

  &__prop-item {
    &:not(:last-child) {
      @apply mb-4;
    }
  }

  &__title {
    @apply text-sm font-medium mr-1;
  }
}
</style>

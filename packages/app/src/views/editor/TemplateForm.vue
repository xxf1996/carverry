<template>
  <drawer-container
    v-model="proxyVisible"
    title="保存模板"
    :loading="submitting"
  >
    <el-form
      ref="formRef"
      class="p-4"
      label-width="100px"
      :model="formData"
      :rules="rules"
    >
      <el-form-item
        label="模板名称"
        prop="name"
      >
        <el-input
          v-model="formData.name"
          placeholder="模板名称"
          show-word-limit
          :maxlength="50"
        />
      </el-form-item>
      <el-form-item
        label="模板描述"
        prop="desc"
      >
        <el-input
          v-model="formData.desc"
          placeholder="描述模板具体功能"
          type="textarea"
          show-word-limit
          :maxlength="500"
          :rows="4"
        />
      </el-form-item>
      <el-form-item
        label="模板类型"
        prop="type"
      >
        <el-input
          v-model="formData.type"
          placeholder="从功能或用途上进行分类"
          show-word-limit
          :maxlength="10"
        />
      </el-form-item>
      <el-form-item
        label="使用截图"
        prop="cover"
      >
        <el-switch v-model="formData.cover" />
      </el-form-item>
    </el-form>
  </drawer-container>
</template>

<script lang="ts" setup>
import { boolProps, proxyProp } from '@/composition/props';
import { ElFormInstance } from '@/typings/common';
import { simpleRule, simpleValidator } from '@/utils/form';
import { defaultBoolean, defaultString } from '@/utils/struct';
import { create, object } from 'superstruct';
import { computed, reactive, ref, watch } from 'vue';

const formDataType = object({
  name: defaultString(),
  desc: defaultString(),
  cover: defaultBoolean(true),
  type: defaultString(),
});
const props = defineProps({
  visible: boolProps(),
});
const formRef = ref<ElFormInstance>();
const submitting = ref(false);
let formData = reactive(create({}, formDataType));
const rules = computed(() => ({
  name: [
    simpleRule('请输入模板名称'),
    simpleValidator<string>((val) => /^[A-Za-z0-9\-_]+$/.test(val), '只能使用英文字母、数字、\'-\'、\'_\''),
  ],
}));
const proxyVisible = proxyProp(props, 'visible');

function initData() {
  formData = reactive(create({}, formDataType));
}

watch(() => props.visible, (val) => {
  if (val) {
    initData();
  }
});
</script>
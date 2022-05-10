<template>
  <drawer-container
    v-model="proxyVisible"
    title="保存模板"
    :loading="submitting"
    @ok="addTemplate"
    @cancel="proxyVisible = false;"
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
import { TemplateInfo } from '@/typings/editor';
import { simpleRule, simpleValidator } from '@/utils/form';
import { defaultBoolean, defaultString } from '@/utils/struct';
import { ElMessage } from 'element-plus';
import { create, object } from 'superstruct';
import { computed, reactive, ref, watch } from 'vue';
import { curOption, templates, updateTemplates } from './state';

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
let formData = ref(create({}, formDataType));
const templateNames = computed<string[]>(() => templates.value.map((template) => template.name));
const rules = computed(() => ({
  name: [
    simpleRule('请输入模板名称'),
    simpleValidator<string>((val) => /^[A-Za-z0-9\-_]+$/.test(val), '只能使用英文字母、数字、\'-\'、\'_\''),
    simpleValidator<string>((val) => !templateNames.value.includes(val), '名称已存在'),
  ],
}));
const proxyVisible = proxyProp(props, 'visible');

function initData() {
  formData.value = reactive(create({}, formDataType));
}

async function addTemplate() {
  if (!formRef.value || !curOption.value) {
    return;
  }
  await formRef.value.validate();
  submitting.value = true;
  console.log(formData.value);
  const info: TemplateInfo = {
    ...formData.value,
    config: curOption.value,
    cover: '', // TODO: 支持截图
  };
  await fetch('/editor-api/templates/add', {
    method: 'post',
    body: JSON.stringify({
      config: JSON.stringify(info),
    }),
  }).then((res) => {
    if (res.status !== 200) {
      return Promise.reject(res);
    }
  }).finally(() => {
    submitting.value = false;
  });
  proxyVisible.value = false;
  ElMessage.success('模板保存成功！');
  updateTemplates();
}

watch(() => props.visible, (val) => {
  if (val) {
    initData();
  }
});
</script>
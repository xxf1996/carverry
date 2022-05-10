<template>
  <drawer-container
    v-model="proxyVisible"
    title="新建Block"
    :loading="submitting"
    @ok="addBlock"
    @cancel="proxyVisible = false;"
  >
    <el-form
      ref="formRef"
      class="p-4"
      :model="formData"
      :rules="rules"
    >
      <el-form-item
        label="Block名称"
        prop="name"
      >
        <el-input
          v-model="formData.name"
          placeholder="请输入Block名称"
          show-word-limit
          :maxlength="50"
        />
      </el-form-item>
    </el-form>
  </drawer-container>
</template>

<script lang="ts" setup>
import { boolProps, proxyProp } from '@/composition/props';
import { computed, reactive, ref } from 'vue';
import { simpleRule, simpleValidator } from '@/utils/form';
import { ElForm } from 'element-plus';
import { useRouter } from 'vue-router';
import { blocks, updateBlocks } from './state';

const router = useRouter();
const props = defineProps({
  visible: boolProps(),
});
const formData = reactive({
  name: '',
});
const formRef = ref<InstanceType<typeof ElForm>>();
const submitting = ref(false);
const rules = computed(() => ({
  name: [
    simpleRule('请输入Block名称'),
    simpleValidator<string>((val) => /[A-Za-z0-9\-_]+/.test(val), '只能使用英文字母、数字、\'-\'、\'_\''),
    simpleValidator<string>((val) => !blocks.value.includes(val), '名称已存在'),
  ],
}));
const proxyVisible = proxyProp(props, 'visible');

/**
 * 跳转到指定block
 */
function toBlock(name: string) {
  router.push({
    name: 'Editor',
    query: {
      block: name,
    },
  });
}

/** 新增block */
async function addBlock() {
  if (!formRef.value) {
    return;
  }
  await formRef.value.validate();
  submitting.value = true;
  await fetch('/editor-api/block', {
    method: 'post',
    body: JSON.stringify({
      name: formData.name,
    }),
  }).finally(() => {
    submitting.value = false;
  });
  proxyVisible.value = false;
  toBlock(formData.name);
  updateBlocks();
}
</script>
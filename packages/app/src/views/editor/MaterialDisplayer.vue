<template>
  <el-drawer
    v-model="proxyVisible"
    title="物料库"
    :modal="false"
    :size="500"
  >
    <el-tabs
      v-model="curSelected"
      class="px-2"
    >
      <el-tab-pane
        label="本地组件"
        name="local"
      >
        <component-display @start="proxyVisible = false;" />
      </el-tab-pane>
      <el-tab-pane
        v-for="pkg in packages"
        :key="pkg.packageName"
        :label="pkg.name"
        :name="pkg.packageName"
      >
        <div class="p-2">
          <p class="my-2">
            <span class="font-medium">安装状态：</span>
            {{ pkg.installed ? '已安装' : '未安装' }}
          </p>
          <el-button
            v-if="!pkg.installed"
            class="my-2"
            type="primary"
            size="small"
            :loading="installing === pkg.packageName"
            @click="toInstall(pkg.packageName)"
          >
            安装物料包
          </el-button>
          <p
            v-if="pkg.installed && pkg.version"
            class="py-2"
          >
            <span class="font-medium">安装版本：</span>
            {{ pkg.version }}
          </p>
          <el-collapse v-if="pkg.installed">
            <el-collapse-item
              v-for="group in pkg.groups"
              :key="`${pkg.packageName}-${group.name}`"
              :title="group.name"
              :name="group.name"
            >
              <material-group
                :items="group.materials"
                @start="proxyVisible = false;"
              />
            </el-collapse-item>
          </el-collapse>
        </div>
      </el-tab-pane>
    </el-tabs>
  </el-drawer>
</template>

<script lang="ts" setup>
import { installMaterial, packages, updatePackages } from './state';
import ComponentDisplay from './ComponentDisplay.vue';
import { ref } from 'vue';
import MaterialGroup from './MaterialGroup.vue';
import { boolProps, proxyProp } from '@/composition/props';
import { ElMessage } from 'element-plus';

const props = defineProps({
  visible: boolProps(),
});
const emit = defineEmits<{
  (event: 'update:visible', val: boolean): void;
}>();
const curSelected = ref('local');
const proxyVisible = proxyProp(props, 'visible');
/** 安装中的包名 */
const installing = ref('');

async function toInstall(packageName: string) {
  installing.value = packageName;
  await installMaterial(packageName).finally(() => {
    installing.value = '';
  });
  ElMessage.success('安装完成！');
  updatePackages();
}
</script>
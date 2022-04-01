import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';
import ElementPlus from 'unplugin-element-plus/vite';
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers';
import WindiCSS from 'vite-plugin-windicss';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: [
      {
        find: /^@\//,
        replacement: resolve(__dirname, 'src') + '/',
      }, // 模块路径alias
    ],
  },
  css: {
    // 自动按需引入插件（unplugin-vue-components）需要配置这个来覆盖样式变量；
    // https://element-plus.gitee.io/zh-CN/guide/theming.html#%E5%A6%82%E4%BD%95%E8%A6%86%E7%9B%96%E5%AE%83%EF%BC%9F
    preprocessorOptions: {
      scss: {
        additionalData: '@use "./src/style/element.scss" as *;',
      },
    },
  },
  plugins: [
    vue(),
    WindiCSS(),
    AutoImport({
      resolvers: [ElementPlusResolver()],
    }),
    Components({
      resolvers: [ElementPlusResolver()],
    }),
    ElementPlus(),
  ],
  server: {
    port: 3300,
    open: true,
    proxy: {
      '/editor-api': {
        target: 'http://localhost:3344/',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/editor-api/, ''),
      },
    },
  },
  preview: {
    port: 3300,
  },
});

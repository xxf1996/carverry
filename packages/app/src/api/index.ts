import { FileInfoV2 } from '@/typings/editor';

const BASE_URL = '/editor-api';

/**
 * 获取当前项目逻辑文件信息
 */
export async function getLogicFileInfo() {
  const data = await fetch(`${BASE_URL}/language/files`, {
    method: 'get',
  }).then((res) => {
    return res.json() as Promise<FileInfoV2>;
  });

  return data;
}

/**
 * 获取vue prop类型
 * @param filePath
 * @param prop
 */
export async function getPropType(filePath: string, prop: string) {
  const data = await fetch(`${BASE_URL}/language/vue-prop?filePath=${filePath}&prop=${prop}`, {
    method: 'get',
  }).then((res) => {
    return res.text();
  });

  return data;
}

/**
 * 根据组件prop类型对指定逻辑文件进行类型过滤
 * @param tsPath 逻辑文件path
 * @param vuePath （本地）组件文件path
 * @param prop 组件prop
 * @returns 
 */
export async function filterByProp(tsPath: string, vuePath: string, prop: string) {
  const data = await fetch(`${BASE_URL}/language/filter-prop?tsPath=${tsPath}&vuePath=${vuePath}&prop=${prop}`, {
    method: 'get',
  }).then((res) => {
    return res.json() as Promise<string[]>;
  });

  return data;
}

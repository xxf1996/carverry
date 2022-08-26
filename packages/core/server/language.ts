import { Nullable } from '@carverry/app/src/typings/common';
import type { Project } from 'ts-morph';
import { getAliasType, getExportedMap } from '../plugins/language-server/common.js';
import { createVueTSProject } from '../plugins/language-server/project.js';
import { getPropMemberNode, getVueFilePropsNode } from '../plugins/language-server/vue.js';
import { getContext } from './project.js';

let project: Nullable<Project> = null;
let needUpdate = true;

async function getLangProject() {
  if (needUpdate || !project) {
    const context = await getContext();
    project = await createVueTSProject(context.root);
    needUpdate = false;
  }

  return project;
}

export async function langTest() {
  const langProject = await getLangProject();
  const prop = getPropMemberNode(langProject, 'MultiChart.vue.ts', 'data');
  if (prop) {
    return getAliasType(langProject, prop);
  }

  return 'any(not found)';
}

/**
 * 获取一个ts文件的导出成员及其类型映射
 * @param filePath ts文件路径
 * @returns 
 */
export async function getTsExports(filePath: string) {
  const langProject = await getLangProject();
  const exportedMap = getExportedMap(langProject, filePath);
  const obj: Record<string, string> = {};

  exportedMap?.forEach((val, key) => {
    obj[key] = val;
  });

  return obj;
}

/**
 * 获取vue文件的props type
 * @param filePath vue文件路径
 * @returns
 */
export async function getVueProps(filePath: string) {
  const langProject = await getLangProject();
  const props = getVueFilePropsNode(langProject, filePath);

  return props ? getAliasType(langProject, props) : '{}';
}

/**
 * 根据prop过滤出指定ts文件兼容该prop类型的导出成员
 * @param tsPath ts文件路径
 * @param vuePath vue（组件）文件路径
 * @param prop prop key
 */
export async function filterExportsByProp(tsPath: string, vuePath: string, prop: string) {
  // TODO
}

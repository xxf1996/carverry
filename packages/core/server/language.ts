import { Nullable } from '@carverry/app/src/typings/common';
import type { Project } from 'ts-morph';
import { getAliasType, getExportedMap, getHostPath } from '../plugins/language-server/common.js';
import { createVueTSProject } from '../plugins/language-server/project.js';
import { getPropMemberNode, getVueFilePropsNode } from '../plugins/language-server/vue.js';
import { getRelativePath, globAsync } from '../utils/file.js';
import { getContext } from './project.js';
import { resolve } from 'path';
import { getFileTree } from '../plugins/file-meta.js';
import { FileExportMemberV2, FileInfoV2 } from '@carverry/app/src/typings/editor';

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
 * 获取vue文件单个prop类型
 * @param filePath vue文件路径
 * @param prop prop name
 */
export async function getVuePropType(filePath: string, prop: string) {
  const langProject = await getLangProject();
  const context = await getContext();
  // 拼接完整路径进行匹配，默认从客户端传来的是相对路径（相对于项目根目录）
  const propNode = getPropMemberNode(langProject, resolve(context.root, filePath), prop);

  if (!propNode) {
    return 'unknown';
  }

  return getAliasType(langProject, propNode, true);
}

/**
 * 根据prop过滤出指定ts文件兼容该prop类型的导出成员
 * @param tsPath ts文件路径
 * @param vuePath vue（组件）文件路径
 * @param prop prop key
 */
export async function filterExportsByProp(tsPath: string, vuePath: string, prop: string): Promise<string[]> {
  const langProject = await getLangProject();
  const exportedMap = getExportedMap(langProject, tsPath);
  const propNode = getPropMemberNode(langProject, vuePath, prop);
  const tsAst = langProject.getSourceFile(getHostPath(tsPath));

  if (!exportedMap || !tsAst) {
    return [];
  }

  /** 导出成员标识符列表 */
  const keys = Array.from(exportedMap.keys());

  if (!propNode) {
    return keys;
  }

  const propType = propNode.getType();
  const typeChecker = langProject.getTypeChecker();

  return keys.filter((key) => {
    // 使用vue自带的UnwrapRef泛型可以直接解套ref/computedRef类型，获取里面的数据类型
    // import('vue')可直接在type alias声明中导入模块，避免需要对AST节点或源码直接插入import节点
    const aliasType = tsAst.addTypeAlias({
      name: `CarverryAliasType${key}`,
      type: `import('vue').UnwrapRef<typeof ${key}>`,
    });
    const aliasTypeNode = aliasType.getType();
    /** 类型兼容性，即检测当前导出成员类型是否兼容prop类型 */
    const typeAssignable: boolean = typeChecker.compilerObject.isTypeAssignableTo(propType.compilerType, aliasTypeNode.compilerType); // isTypeAssignableTo是ts complier API暴露的一个内部方法

    aliasType.remove(); // 用完后清除alias声明

    return typeAssignable;
  });
}

/**
 * 获取项目中ts/js（即逻辑）文件的信息
 * @returns
 */
export async function getTsFileInfo(): Promise<FileInfoV2> {
  const context = await getContext();
  // 忽略源码输出目录里面的文件
  const res = await globAsync(resolve(context.root, context.sourceDir, '**/*.@(ts|js)'), resolve(context.root, context.pageOutDir, '**'));
  const files = res.filter((item) => !/\.d\.ts$/.test(item));
  const fileMap: FileInfoV2['fileMap'] = {};
  const fileTree = getFileTree(files, context.root);
  const langProject = await getLangProject();

  files.forEach((filePath) => {
    const exportMap = getExportedMap(langProject, filePath);
    if (!exportMap) {
      return;
    }
    const map: Record<string, FileExportMemberV2> = {};
    exportMap.forEach((type, key) => {
      map[key] = {
        name: key,
        desc: '', // TODO: 从jsdoc中提取（https://ts-morph.com/details/documentation）
        type,
      };
    });
    fileMap[getRelativePath(context.root, filePath)] = map;
  });

  return {
    fileMap,
    fileTree,
  };
}

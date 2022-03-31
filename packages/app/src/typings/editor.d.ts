import { ComponentDoc } from 'vue-docgen-api';
import { Nullable } from './common';

export interface ComponentMeta {
  name?: string;
  path?: string;
  doc: ComponentDoc;
}

export interface SlotAppendEvent {
  meta: Nullable<Required<ComponentMeta>>;
  slot: string;
  before?: number;
}

export interface ComponentLeafNode {
  /** 组件路径，也是唯一标识符 */
  path: string;
}

export interface ComponentTree {
  children: Record<string, ComponentTree | ComponentLeafNode>;
}

export type ComponentInfo = {
  componentTree: ComponentTree;
  componentMap: Record<string, Required<ComponentMeta>>;
};

/** 组件需要的变量依赖 */
export interface ComponentDependence {
  /** 文件路径 */
  path: string;
  /** 导出成员 */
  member: string;
}

/** 组件配置 */
export interface ComponentOption {
  /** 组件自身路径 */
  path: string;
  /** 配置树结构中的标识 */
  key: string;
  /** props映射配置 */
  props: Record<string, ComponentDependence & {
    /** 是否绑定v-model */
    model?: boolean; // 支持双向绑定配置
  }>;
  /** events映射配置 */
  events: Record<string, ComponentDependence>;
  /** slots填充配置 */
  slots: Record<string, (ComponentOption & {
    /** 直接跳过为空，即不给该slot填充一个默认的内容，以便有些组件本身就有默认slot内容； */
    skip?: boolean; // TODO: 增加交互设置skip属性
  })[]>;
}

export interface FileExportMember {
  name: string;
  desc: string;
  type: 'function' | 'var';
}

export interface FileLeafNode {
  fullPath: string;
}

export interface FileTree {
  children: Record<string, FileTree | FileLeafNode>
}

export interface FileInfo {
  fileTree: FileTree;
  fileMap: Record<string, Record<string, FileExportMember>>
}

/** 一个物料（组件）的配置信息 */
export interface MaterialItemConfig {
  /** 简短标题 */
  title: string;
  /** 类型 */
  type: string;
  /** 概览图 */
  cover?: string;
  /** 物料功能描述 */
  desc?: string;
  /** 物料入口文件（vue） */
  entry?: string;
}

/** 单个物料的信息 */
export interface MaterialItem {
  /** 组件元数据 */
  meta: Required<ComponentMeta>;
  /** 物料配置 */
  config: MaterialItemConfig;
  /** 预览图（base64） */
  cover?: string;
}

/** 物料分组 */
export interface MaterialPackageGroup {
  /** 分组名称 */
  name: string;
  /** 下属物料 */
  materials: MaterialItem[];
}

/** 单个物料包的信息 */
export interface MaterialPackage {
  /** 本地项目是否已经安装 */
  installed: boolean;
  /** 安装版本 */
  version?: string;
  /** 物料包名称 */
  name: string;
  /** `npm`包名 */
  packageName: string;
  /** 物料分组 */
  groups: MaterialPackageGroup[];
}

import { ComponentDoc } from 'vue-docgen-api';

export interface ComponentMeta {
  name?: string;
  path?: string;
  doc: ComponentDoc;
}

export type ComponentInfo = Record<string, Required<ComponentMeta>>;

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
  key?: string;
  // TODO: 通用指令支持（v-if/v-show/v-loading）
  /** props映射配置 */
  props: Record<string, ComponentDependence & {
    /** 是否绑定v-model */
    model?: boolean; // 支持双向绑定配置
  }>;
  /** events映射配置 */
  events: Record<string, ComponentDependence>;
  /** slots填充配置 */
  slots: Record<string, ComponentOption[]>;
}

export interface FileExportMember {
  name: string;
  desc: string;
  type: 'funtion' | 'var';
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

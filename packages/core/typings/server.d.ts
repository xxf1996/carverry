import { ComponentMeta, ComponentOption } from '@carverry/app/src/typings/editor';
import { ProjectContext } from './context';

interface ProjectDB {
  context: ProjectContext;
}

export type SocketType = 'app' | 'target';

export interface SocketInit {
  type: 'init';
  id: SocketType;
}

export interface SocketDragover {
  type: 'dragover';
  id: SocketType;
  x: number;
  y: number;
}

export interface SocketDrop {
  type: 'drop';
  id: SocketType;
  x: number;
  y: number;
  /** 当前拖拽组件的元数据，为空说明拖拽结束了 */
  meta?: Required<ComponentMeta>;
}

export interface SocketConfigChange {
  type: 'config-change';
  id: SocketType;
  /** 位于配置树上的key，没有说明配置是空的，空字符串则代表为树节点 */
  key?: string;
  /** 插入的slot */
  slot: string;
  /** 插入索引，位于现在索引为before的前面，before为空则代表插入到最后 */
  before?: number;
  /** 插入组件的元数据 */
  meta: Required<ComponentMeta>;
}

export interface SocketSlotChange {
  type: 'slot-change';
  id: SocketType;
  /** 父级结点key */
  parent: string;
  /** 所属的slot */
  slot: string;
  newIdx: number;
  oldIdx: number;
}

export interface SocketSelected {
  type: 'selected';
  id: SocketType;
  key: string;
}

export interface SocketHover {
  type: 'hover';
  id: SocketType;
  x: number;
  y: number;
  /** 为负值则代表没有hover命中 */
  width: number;
  height: number;
}

/** websocket通信事件 */
export type SocketEvent = SocketInit | SocketDragover | SocketDrop | SocketConfigChange | SocketSlotChange | SocketSelected | SocketHover;

export interface PreviewParams {
  block: string;
  option?: ComponentOption;
}

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
  /** 当前拖拽组件的元数据 */
  meta: Required<ComponentMeta>;
}

/** websocket通信事件 */
export type SocketEvent = SocketInit | SocketDragover | SocketDrop;

export interface PreviewParams {
  block: string;
  option?: ComponentOption;
}

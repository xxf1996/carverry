export interface ProjectConfig {
  /** 项目名称 */
  name: string;
  /** 源码目录（相对于根目录的相对路径） */
  sourceDir: string;
  /** 页面源码文件输出目录（相对于根目录的相对路径） */
  pageOutDir: string;
  /** 可视化搭建应用端口 */
  port: number;
  /** 是否为只读模式（只读不可编辑，只可查看） */
  readOnly: boolean;
}

interface AliasPath {
  [key: string]: string | string[];
}

export interface ProjectContext extends ProjectConfig {
  /** 项目根目录 */
  root: string;
  alias: AliasPath;
  // TODO
  /** 本地项目开发端口，默认为3000；从vite配置直接读取 */
  devPort?: number;
}

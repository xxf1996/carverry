export interface ProjectConfig {
  /** 项目根目录 */
  root: string;
  /** 项目名称 */
  name: string;
  /** 源码目录（相对于根目录的相对路径） */
  sourceDir: string;
  /** 页面源码文件输出目录（相对于根目录的相对路径） */
  pageOutDir: string;
}

interface AliasPath {
  [key: string]: string | string[];
}

export interface ProjectContext extends ProjectConfig {
  alias: AliasPath;
}

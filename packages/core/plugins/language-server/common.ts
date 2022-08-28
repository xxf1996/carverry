/* eslint-disable @typescript-eslint/ban-types */
import { Node, Project, ts, Symbol, Type } from 'ts-morph';

/**
 * 直接从symbol节点找到其对应的类型节点
 * @param node symbol节点
 * @returns 
 */
function getSymbolType(node: Symbol) {
  const declarations = node.getDeclarations();

  if (declarations.length === 0) { // 确保有类型声明
    return node.getDeclaredType();
  }

  return declarations[0].getType();
}

/**
 * 获取某个AST节点的完整类型描述
 * @param project 项目上下文
 * @param node AST节点
 */
export function getAliasType(project: Project, node: Node<ts.Node> | Symbol) {
  const typeChecker = project.getTypeChecker();
  const type = Node.isNode(node) ? node.getType() : getSymbolType(node);
  // ts.TypeFormatFlags.NoTruncation flag可以避免对类型描述进行省略（因为描述内容过多时，默认会用...省略部分内容）
  return typeChecker.getTypeText(type, undefined, ts.TypeFormatFlags.InTypeAlias | ts.TypeFormatFlags.NoTruncation);
}

/**
 * 自动将.vue转为.vue.ts，用于匹配自定义文件系统，找到正确的sourceFile
 * @param filePath
 * @returns 
 */
export function getHostPath(filePath: string) {
  let hostFilePath = filePath;
  if (/\.vue$/.test(filePath)) {
    hostFilePath = `${filePath}.ts`; // 将.vue转为.vue.ts
  }

  return hostFilePath;
}

/**
 * 获取ts的导出成员类型映射
 * @param project 项目上下文
 * @param filePath 文件路径
 */
export function getExportTypes(project: Project, filePath: string) {
  const ast = project.getSourceFile(getHostPath(filePath));
  if (!ast) {
    return null;
  }
  const exportedMap = ast.getExportedDeclarations();
  const res: Map<string, Type<ts.Type>> = new Map();

  exportedMap.forEach((declarations, key) => {
    res.set(key, declarations[0].getType());
  });

  return res;
}

/**
 * 获取单个ts文件的导出成员与类型描述映射；key为导出成员标识符，value为类型描述；
 * @param project 项目上下文
 * @param filePath 文件路径
 */
export function getExportedMap(project: Project, filePath: string) {
  const ast = project.getSourceFile(getHostPath(filePath));
  if (!ast) {
    return null;
  }
  const exportedMap = ast.getExportedDeclarations();
  const res: Map<string, string> = new Map();
  exportedMap.forEach((declarations, key) => {
    const types: string[] = [];
    declarations.forEach((declaration) => {
      types.push(getAliasType(project, declaration));
    });
    res.set(key, types.join(' | '));
  });

  return res;
}

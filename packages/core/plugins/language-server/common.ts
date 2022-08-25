import { Node, Project, ts } from 'ts-morph';

/**
 * 获取某个AST节点的完整类型描述
 * @param project 项目上下文
 * @param node AST节点
 */
export function getAliasType(project: Project, node: Node<ts.Node>) {
  const typeChecker = project.getTypeChecker();
  // ts.TypeFormatFlags.NoTruncation flag可以避免对类型描述进行省略（因为描述内容过多时，默认会用...省略部分内容）
  return typeChecker.getTypeText(node.getType(), undefined, ts.TypeFormatFlags.InTypeAlias | ts.TypeFormatFlags.NoTruncation);
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

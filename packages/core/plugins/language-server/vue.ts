import { ExportAssignment, Node, Project, ts } from 'ts-morph';

/**
 * 根据vue编译生成的ts代码结构特点，从对应的default export节点截取出该组件的props类型
 * @param assignment default export声明节点
 * @returns
 */
function getPropsType(assignment: ExportAssignment) {
  // 获取到defineComponent参数节点（对象）
  const getObj = (node: Node<ts.Node>) => {
    if (node.getKind() === ts.SyntaxKind.ObjectLiteralExpression) {
      return node as Node<ts.ObjectLiteralExpression>;
    }

    return node.forEachChild<Node<ts.Node>>(getObj) as Node<ts.ObjectLiteralExpression>;
  };
  const obj = assignment.forEachChild(getObj);
  if (!obj) {
    return null;
  }
  // 获取到setup方法声明节点
  const setup = obj.forEachChild((node) => {
    if (node.getKind() === ts.SyntaxKind.MethodDeclaration && (node as Node<ts.MethodDeclaration>).compilerNode.name.getText() === 'setup') {
      return node as Node<ts.MethodDeclaration>;
    }
  });
  if (!setup) {
    return null;
  }
  // 获取到props声明节点
  const getProps = (node: Node<ts.Node>) => {
    // FIXME: 貌似props的编译根据声明方式有所不同
    if (node.getKind() === ts.SyntaxKind.VariableDeclaration && (node as Node<ts.VariableDeclaration>).compilerNode.name.getText() === 'props') {
      return node as Node<ts.VariableDeclaration>;
    }

    return node.forEachChild<Node<ts.Node>>(getProps) as Node<ts.VariableDeclaration>;
  };
  const props = setup.forEachChild(getProps);
  if (!props) {
    return null;
  }
  return props.getType();
}

/**
 * 从指定vue文件中获取对应的props类型
 * @param project 编译上下文
 * @param filePath 文件路径
 * @returns 
 */
export function getVueFilePropsType(project: Project, filePath: string) {
  const ast = project.getSourceFile(filePath);
  if (!ast) {
    return null;
  }
  /** 通过export default节点找到defineComponent */
  const defineComponent = ast.getExportAssignment((assignment) => !assignment.isExportEquals());
  if (!defineComponent) {
    return null;
  }
  return getPropsType(defineComponent);
}
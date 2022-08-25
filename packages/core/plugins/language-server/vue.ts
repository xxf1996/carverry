import { ExportAssignment, Node, Project, SourceFile, ts, VariableDeclaration } from 'ts-morph';
import { getHostPath } from './common.js';

function getPropsTypeWithObject(obj: Node<ts.ObjectLiteralExpression>) {
  const propsDeclaration = obj.forEachChild((node) => {
    if (Node.isPropertyAssignment(node) && node.compilerNode.name.getText() === 'props') {
      return node;
    }
  });

  if (!propsDeclaration) {
    return null;
  }

  return propsDeclaration;
}

/**
 * 通过事先对vue组件的ts编译，直接从其ts文件的SourceFile获取props type
 *
 * 适用于除defineProps<Type>()以外的vue3编译
 */
function getPropsTypeFromAST(ast: SourceFile) {
  const props = ast.forEachChild((node) => {
    // 通过事先编译好的CarverryComponentProps类型直接获取
    if (Node.isTypeAliasDeclaration(node) && node.getName() === 'CarverryComponentProps') {
      return node;
    }
  });

  if (!props) {
    return null;
  }

  return props;
}

/**
 * 根据vue编译生成的ts代码结构特点，从对应的default export节点截取出该组件的props类型
 * @param assignment default export声明节点
 * @returns
 */
function getPropsType(assignment: ExportAssignment, ast: SourceFile) {
  // 获取到defineComponent参数节点（对象）
  const getObj = (node: Node<ts.Node>) => {
    if (Node.isObjectLiteralExpression(node)) {
      return node;
    }

    return node.forEachChild<Node<ts.Node>>(getObj) as Node<ts.ObjectLiteralExpression>;
  };
  const obj = assignment.forEachChild(getObj);
  if (!obj) {
    return null;
  }
  // 获取到setup方法声明节点
  const setup = obj.forEachChild((node) => {
    if (Node.isMethodDeclaration(node) && node.getName() === 'setup') {
      return node;
    }
  });
  if (!setup) {
    return null;
  }
  // 获取到props声明节点
  const getProps = (node: Node<ts.Node>) => {
    // 貌似props的编译根据声明方式有所不同（目前只有setup模式，且通过defineProps<Type>的方式才会编译成props = __props as xxx）的形式
    if (Node.isVariableDeclaration(node) && node.getName() === 'props') {
      return node;
    }

    return node.forEachChild<Node<ts.Node>>(getProps) as VariableDeclaration;
  };
  const props = setup.forEachChild(getProps);
  if (!props) {
    return getPropsTypeFromAST(ast);
  }
  const t = props.getType();

  if (t.getFlags() === ts.TypeFlags.Any) {
    return getPropsTypeFromAST(ast);
  }

  return props;
}

/**
 * 从指定vue文件中获取对应的props类型
 * @param project 编译上下文
 * @param filePath 文件路径
 * @returns
 */
export function getVueFilePropsType(project: Project, filePath: string) {
  const ast = project.getSourceFile(getHostPath(filePath));
  if (!ast) {
    return null;
  }
  // console.log(ast.compilerNode.text);
  /** 通过export default节点找到defineComponent */
  const defineComponent = ast.getExportAssignment((assignment) => !assignment.isExportEquals());
  if (!defineComponent) {
    return null;
  }
  return getPropsType(defineComponent, ast);
}
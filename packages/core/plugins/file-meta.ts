import typescript from 'typescript';
import type { JSDoc, FunctionDeclaration, VariableStatement, ExportAssignment } from 'typescript';
import { readFile } from 'fs/promises';
import { FileExportMember, FileInfo, FileTree } from '../../app/src/typings/editor';
import { getContext } from '../server/project.js';
import { globAsync, getRelativePath } from '../utils/file.js';
import { resolve } from 'path';

const { isJSDocCommentContainingNode, isObjectBindingPattern, isFunctionDeclaration, isVariableStatement, isExportAssignment, createSourceFile, forEachChild, ScriptTarget, SyntaxKind } = typescript; // 因为没有按照ESM模块导出

/**
 * 获取jsdoc信息
 */
function getJsDocInfo(jsDoc: JSDoc[]) {
  let desc = '';
  const comments = jsDoc.filter(isJSDocCommentContainingNode);
  if (comments.length > 0) {
    desc = comments[0].comment as string;
  }
  return desc;
}

/**
 * 获取函数声明信息
 * @param node 函数声明
 */
function getFunctionDoc(node: FunctionDeclaration): FileExportMember {
  return {
    desc: getJsDocInfo(node.jsDoc || []),
    name: node.name ? node.name.escapedText as string : 'default', // 默认导出的函数就没有name
    type: 'function',
  };
}

/**
 * 获取变量声明信息
 * @param {ts.VariableStatement} node 变量声明
 */
function getVarDoc(node: VariableStatement): FileExportMember[] {
  const { declarations } = node.declarationList;
  const { name } = declarations[0];
  let res: FileExportMember[] = [];
  if (isObjectBindingPattern(name)) { // 判断是不是解构导出，解构可能会有多个成员
    res = name.elements.map((el) => ({
      desc: getJsDocInfo(el.jsDoc || []),
      name: el.name.escapedText || '匿名了',
      type: 'var',
    }));
  } else {
    res.push({
      desc: getJsDocInfo(node.jsDoc || []),
      name: name.escapedText || '匿名了',
      type: 'var',
    });
  }
  return res;
}

/**
 * 获取默认导出信息
 * @param node 导出声明
 */
function getDefaultDoc(node: ExportAssignment): FileExportMember {
  return {
    desc: getJsDocInfo(node.jsDoc || []),
    name: 'default',
    type: 'var',
  };
}

/**
 * 获取结点文档信息
 * @param node
 */
function getNodeDoc(node: FunctionDeclaration | VariableStatement | ExportAssignment) {
  let res: FileExportMember[] = [{
    name: '',
    desc: '',
    type: 'var',
  }];
  if (isFunctionDeclaration(node)) {
    res = [getFunctionDoc(node)];
  } else if (isVariableStatement(node)) {
    res = getVarDoc(node);
  } else if (isExportAssignment(node)) {
    res = [getDefaultDoc(node)];
  }

  return res;
}

async function tsFileInfo(path: string) {
  const code = await readFile(path, { encoding: 'utf-8' });
  const source = createSourceFile(path, code, ScriptTarget.ES2020);
  const fileInfo: Record<string, FileExportMember> = {};
  forEachChild(source, (node) => {
    if ((isFunctionDeclaration(node) || isVariableStatement(node)) && node.modifiers) {
      const exports = node.modifiers.filter((modifier) => modifier.kind === SyntaxKind.ExportKeyword);
      if (exports.length === 0) {
        return;
      }
      // console.log(exports, node.name);
      const infos = getNodeDoc(node);
      infos.forEach((info) => {
        fileInfo[info.name] = info;
      });
    } else if (isExportAssignment(node)) {
      const infos = getNodeDoc(node);
      infos.forEach((info) => {
        fileInfo[info.name] = info;
      });
    }
  });
  return fileInfo;
}

/**
 * 获取文件树
 * @param files 所有有效文件路径（相对路径，根目录就是项目目录）
 */
function getFileTree(files: string[], rootDir: string) {
  const root: FileTree = {
    children: {},
  };
  files.forEach((filePath) => {
    const paths = filePath.split('src/')[1].split('/');
    let curNode = root;
    paths.forEach((p, idx) => {
      if (idx === paths.length - 1) {
        const node = {
          fullPath: getRelativePath(rootDir, filePath),
        };
        curNode.children[p] = node;
      } else {
        let node = curNode.children[p];
        if (!node) {
          node = {
            children: {},
          };
        }
        curNode.children[p] = node;
        curNode = node as FileTree;
      }
    });
  });

  return root;
}

export async function getFileInfo(): Promise<FileInfo> {
  const context = await getContext();
  const res = await globAsync(resolve(context.root, context.sourceDir, '**/*.@(ts|js)'));
  const files = res.filter((item) => !/\.d\.ts$/.test(item));
  const fileMap: FileInfo['fileMap'] = {};
  const fileTree = getFileTree(files, context.root);
  const infoList = await Promise.all(files.map((filePath) => tsFileInfo(filePath)));
  infoList.forEach((info, idx) => {
    fileMap[getRelativePath(context.root, files[idx])] = info; // 用项目相对路径作为key
  });
  return {
    fileTree,
    fileMap,
  };
}
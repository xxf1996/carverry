/* eslint-disable @typescript-eslint/no-var-requires */
const glob = require('glob');
const path = require('path');
const {
  createSourceFile, ScriptTarget, forEachChild, isFunctionDeclaration, SyntaxKind, isVariableStatement, isJSDocCommentContainingNode, isExportAssignment, isObjectBindingPattern,
} = require('typescript');
const { promises: { readFile } } = require('fs');
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const ts = require('typescript');

/**
 * 获取
 * @param {ts.JSDoc[]} jsDoc
 */
function getJsDocInfo(jsDoc) {
  let desc = '';
  const comments = jsDoc.filter(isJSDocCommentContainingNode);
  if (comments.length > 0) {
    desc = comments[0].comment;
  }
  return desc;
}

/**
 * 获取函数声明信息
 * @param {ts.FunctionDeclaration} node 函数声明
 */
function getFunctionDoc(node) {
  return {
    desc: getJsDocInfo(node.jsDoc || []),
    name: node.name ? node.name.escapedText : 'default', // 默认导出的函数就没有name
    type: 'function',
  };
}

/**
 * 获取变量声明信息
 * @param {ts.VariableStatement} node 变量声明
 */
function getVarDoc(node) {
  const { declarations } = node.declarationList;
  const { name } = declarations[0];
  let res = [];
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
 * @param {ts.ExportAssignment} node 导出声明
 */
function getDefaultDoc(node) {
  return {
    desc: getJsDocInfo(node.jsDoc || []),
    name: 'default',
    type: 'var',
  };
}

/**
 * 获取结点文档信息
 * @param {ts.FunctionDeclaration | ts.VariableStatement | ts.ExportAssignment} node
 */
function getNodeDoc(node) {
  let res = [{
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

async function tsFileInfo(path) {
  const code = await readFile(path, { encoding: 'utf-8' });
  const source = createSourceFile(path, code, ScriptTarget.ES2020);
  const fileInfo = {};
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

export function getRelativePath(fullPath) {
  return `src/${fullPath.split('src/')[1]}`;
}

/**
 * 获取文件树
 * @param {string[]} files 所有有效文件路径（相对路径，根目录就是项目目录）
 */
function getFileTree(files) {
  const root = {
    children: {},
  };
  files.forEach((filePath) => {
    const paths = filePath.split('src/')[1].split('/');
    let curNode = root;
    paths.forEach((p, idx) => {
      if (idx === paths.length - 1) {
        const node = {
          fullPath: getRelativePath(filePath),
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
        curNode = node;
      }
    });
  });

  return root;
}

function getFileInfo() {
  return new Promise((resolve, reject) => {
    glob(path.resolve(__dirname, '../**/*.@(ts|js)'), (err, res) => {
      if (err) {
        reject(err);
        return;
      }
      const files = res.filter((item) => !/\.d\.ts$/.test(item));
      const fileMap = {};
      const fileTree = getFileTree(files);
      Promise.all(files.map((filePath) => tsFileInfo(filePath))).then((infoList) => {
        infoList.forEach((info, idx) => {
          fileMap[getRelativePath(files[idx])] = info; // 用项目相对路径作为key
        });
        resolve({
          fileTree,
          fileMap,
        });
        // console.log(fileMap);
      });
    });
  });
}

const RESOLVE_ID = 'virtual:fileinfo';

export default function fileInfoPlugin() {
  return {
    name: 'test-fileinfo-plugin',
    resolveId(id) {
      // console.log(id);
      if (id.includes(RESOLVE_ID)) {
        return id;
      }
    },
    async load(id) {
      if (id.includes(RESOLVE_ID)) {
        const res = await getFileInfo();
        return `export default ${JSON.stringify(res, null, 2)}`;
      }
    },
  };
}

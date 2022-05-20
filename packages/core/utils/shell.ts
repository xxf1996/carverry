import { parseNi, runCli } from '@antfu/ni';
import { spawn } from 'child_process';
import { getContext } from '../server/project.js';
import { promiseError } from './tip.js';

/**
 * 执行shell命令，返回promise；
 * 这种方式不能捕获命令输出，但是可以按原格式进行输出；
 * @param shell shell命令
 */
export function execShellOrigin(shell: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const process = spawn(shell, {
      stdio: 'inherit', // 命令的输出按原格式进行输出
      shell: true,
    });
    process.on('close', code => {
      if (code) { // 根据exit code可以判断命令执行结果
        reject(code);
      } else {
        resolve();
      }
    });
  });
}

/**
 * 在本地项目安装指定包
 * @param packageName 包名
 * @param version 版本号
 * @returns
 */
export async function installPackage(packageName: string, version?: string) {
  if (!packageName) {
    return promiseError('没有发现包名！');
  }
  const context = await getContext();
  const originArgv = process.argv.slice(0);
  process.argv = [...process.argv.slice(0, 2), '-C', context.root, version ? `${packageName}@${version}` : packageName]; // 指定本地项目为cwd，然后执行安装命令
  await runCli(parseNi).finally(() => {
    process.argv = originArgv; // 还原argv
  });
}

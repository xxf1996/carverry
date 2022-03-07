import { spawn } from 'child_process';

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
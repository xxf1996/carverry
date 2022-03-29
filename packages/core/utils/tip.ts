import chalk from 'chalk';

export function warning(text: string) {
  console.log(`🙈 ${chalk.yellow(text)}`);
}

export function success(text: string) {
  console.log(`🎉 ${chalk.green(text)}`);
}

export function error(text: string) {
  console.log(`💩 ${chalk.red(text)}`);
}

export function info(text: string) {
  console.log(`ℹ️ ${chalk.blue(text)}`);
}

export function promiseError(reason: string) {
  error(reason);
  return Promise.reject(new Error(reason));
}

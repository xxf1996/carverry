import chalk from 'chalk';

export function warning(text: string) {
  console.log(`đ ${chalk.yellow(text)}`);
}

export function success(text: string) {
  console.log(`đ ${chalk.green(text)}`);
}

export function error(text: string) {
  console.log(`đŠ ${chalk.red(text)}`);
}

export function info(text: string) {
  console.log(`âšī¸ ${chalk.blue(text)}`);
}

export function promiseError(reason: string) {
  error(reason);
  return Promise.reject(new Error(reason));
}

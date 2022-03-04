import chalk from 'chalk';

export function warning(text: string) {
  console.log(`🙈 ${chalk.yellow(text)}`);
}

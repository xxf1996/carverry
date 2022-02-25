import { Command } from 'commander';
import packageInfo from './package.json';

const program = new Command();

program
  .option('-p, --port <port>', '指定可视化应用端口', '3300')
  .version(packageInfo.version, '-v, --version', '运行版本');
program.parse(process.argv);

const options = program.opts();

console.log(options);
// console.log(process.cwd());

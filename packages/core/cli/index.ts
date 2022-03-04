#!/usr/bin/env -S node --no-warnings --loader ts-node/esm

/**
 * 命令脚本；`#!/usr/bin/env -S`可以指定执行程序的同时加上命令参数，就跟在`script`写的命令一样；
 * 
 * - https://github.com/TypeStrong/ts-node/issues/639#issuecomment-538984217
 * - https://github.com/TypeStrong/ts-node#shebang
 */

import { Command } from 'commander';
import { createRequire } from 'module';
import { updatePprojectContext } from './context.js';
import { initConfig, initProjectFiles } from './init.js';

const program = new Command();
const require = createRequire(import.meta.url);
const packageInfo = require('../../../package.json');

program
  .version(packageInfo.version, '-v, --version', '运行版本')
  .command('start', {
    isDefault: true,
  })
  .description('启动可视化搭建应用')
  .option('-p, --port <port>', '指定可视化搭建应用端口', '3300')
  .action(async (options) => {
    await updatePprojectContext(options);
    await initProjectFiles();
  });
program
  .command('init')
  .description('初始化有关可视化搭建的项目配置，生成配置文件')
  .option('-y, --yes', '所有配置都使用默认值')
  .action((options) => {
    initConfig(options.yes);
  });
program.parse(process.argv); // 解析命令行参数
// const options: Partial<ProjectConfig> = program.opts();

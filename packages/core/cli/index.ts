#!/usr/bin/env -S node --no-warnings --loader ts-node/esm

/**
 * 命令脚本；`#!/usr/bin/env -S`可以指定执行程序的同时加上命令参数，就跟在`script`写的命令一样；
 * 
 * - https://github.com/TypeStrong/ts-node/issues/639#issuecomment-538984217
 * - https://github.com/TypeStrong/ts-node#shebang
 */

import { Command } from 'commander';
import { createRequire } from 'module';
import { success } from '../utils/tip.js';
import { updatePprojectContext } from './context.js';
import { checkData, initConfig, initProjectFiles, startApp } from './init.js';
import { buildMaterialProject, buildStory, initMaterialDir, transformPackage } from './material.js';

const program = new Command();
const require = createRequire(import.meta.url);
const packageInfo = require('../../../package.json');
const material = new Command('material');

program.version(packageInfo.version, '-v, --version', '运行版本');
program
  .command('start', {
    isDefault: true,
  })
  .description('启动可视化搭建应用')
  .option('-p, --port <port>', '指定可视化搭建应用端口', '3300')
  .option('-r, --read-only', '只读预览模式')
  .action(async (options) => {
    await checkData();
    await updatePprojectContext(options);
    await initProjectFiles();
    await startApp();
  });
program
  .command('init')
  .description('初始化有关可视化搭建的项目配置，生成配置文件')
  .option('-y, --yes', '所有配置都使用默认值')
  .action((options) => {
    initConfig(options.yes);
  });

material
  .description('物料相关操作')
  .command('add <name>')
  .description('新增一个物料，并进行初始化')
  .action((name: string) => {
    // 往物料文件夹中新建&初始化一个物料文件
    initMaterialDir(process.cwd(), name);
  });
material
  .command('build')
  .description('构建物料库，输出可用的物料文件')
  .action(async () => {
    await buildMaterialProject(process.cwd());
    success('构建成功！');
    // TODO: loading提示
  });
material
  .command('transform')
  .description('转换第三方UI库为物料')
  .action(async () => {
    await transformPackage(process.cwd());
    success('转换成功！');
  });
material
  .command('story')
  .description('自动初始化已有物料的storybook文件')
  .action(async () => {
    await buildStory(process.cwd());
  });
material
  .command('new <name>')
  .description('新建一个物料库的项目')
  .action((name: string) => {
    console.log(name);
    // TODO: 优先级不高
  });
program.addCommand(material);
program.parse(process.argv); // 解析命令行参数
// const options: Partial<ProjectConfig> = program.opts();

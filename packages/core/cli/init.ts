import { ProjectConfig } from '../typings/context';
import inquirer from 'inquirer';
import { existsSync } from 'fs';
import { writeFile, copyFile, mkdir } from 'fs/promises';
import { resolve } from 'path';
import { info, promiseError, success, warning } from '../utils/tip.js';
import { getContext } from '../server/project.js';
import { getDirname } from '../utils/file.js';
import { execShellOrigin, installPackage } from '../utils/shell.js';
import { setTimeout } from 'timers/promises';

// eslint-disable-next-line @typescript-eslint/naming-convention
const __dirname = getDirname(import.meta.url);

function getProjectName(): string {
  const rootDir = process.cwd();
  const paths = rootDir.split('/');
  return paths[paths.length - 1];
}

/**
 * 获取项目默认配置
 */
export function getDefaultConfig(): ProjectConfig {
  return {
    name: getProjectName(),
    sourceDir: 'src',
    port: 3300,
    pageOutDir: 'src/blocks',
    readOnly: false,
  };
}

export async function checkData() {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const dirname = resolve(__dirname, '../server');
  const dbDir = resolve(dirname, 'db');
  if (!existsSync(dbDir)) {
    await mkdir(dbDir);
  }
  const dbFile = resolve(dbDir, 'project.json');
  if (!existsSync(dbFile)) {
    const config = getDefaultConfig();
    await writeFile(dbFile, JSON.stringify(config, null, 2), {
      encoding: 'utf-8',
    });
  }
}

/**
 * 通过命令行交互进行用户自定义配置
 */
async function getUserConfig() {
  const name = getProjectName();
  const answers: ProjectConfig = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: '项目名称',
      default: name,
    },
    {
      type: 'input',
      name: 'sourceDir',
      message: '源码目录',
      default: 'src',
    },
    {
      type: 'input',
      name: 'pageOutDir',
      message: '页面源码输出目录',
      default: 'src/blocks',
    },
    {
      type: 'number',
      name: 'port',
      message: '可视化搭建应用端口',
      default: 3300,
    },
  ]);
  return answers;
}

/** 保存项目配置 */
async function saveConfig(config: ProjectConfig) {
  const rootDir = process.cwd();
  await writeFile(resolve(rootDir, 'carverry.config.json'), JSON.stringify({
    '$schema': 'https://xiexuefeng.cc/schema/carverry.json',
    ...config,
  }, null, 2), {
    encoding: 'utf-8',
  });
  success('carverry.config.json 已生成！');
}

/** 启动服务 */
export async function startApp() {
  const appDir = resolve(__dirname, '../../app');
  if (!existsSync(appDir)) {
    return promiseError('没有发现@carverry/app包！');
  }
  // FIXME: 这里启动命令最好不要用yarn，也许调用时用户并没有安装yarn，应该使用node执行
  const curDir = resolve(__dirname, '..');
  execShellOrigin(`cd ${curDir} && yarn server`); // 先启动服务器
  await setTimeout(3000); // 服务器和应用分属两个不同的线程
  await execShellOrigin(`cd ${appDir} && yarn preview`); // 再启动可视化应用
}

/**
 * 初始化输出目录及缓存目录等文件
 */
export async function initProjectFiles() {
  const context = await getContext();
  const output = resolve(context.root, context.pageOutDir);
  if (!existsSync(output)) {
    await mkdir(output);
    await writeFile(resolve(output, '.gitignore'), '.cache', {
      encoding: 'utf-8',
    });
  }
  const cache = resolve(output, '.cache');
  if (!existsSync(cache)) {
    await mkdir(cache);
    await copyFile(resolve(__dirname, '../template/empty.vue'), resolve(cache, 'index.vue')); // 空白入口文件
  }
}

/**
 * 检测某个包是否已经安装
 * @param packageName 包名
 * @param autoInstall 没有安装时是否自动安装，默认为`true`
 * @returns 
 */
export async function checkPackage(packageName: string, autoInstall = true) {
  const context = await getContext();
  const packageDir = resolve(context.root, 'node_modules', packageName);
  if (existsSync(packageDir)) {
    info(` 📦[${packageName}]已存在！`);
    return;
  }
  if (!autoInstall) {
    return;
  }
  await installPackage(packageName);
  success(` 📦[${packageName}]安装完成！`);
}

/**
 * 初始化项目配置
 * @param useDefault 是否使用默认配置
 */
export async function initConfig(useDefault = false) {
  if (existsSync(resolve(process.cwd(), 'carverry.config.json'))) {
    warning('配置文件已存在，无需初始化！');
    return;
  }
  let config = getDefaultConfig();
  if (!useDefault) {
    config = await getUserConfig();
  }
  await saveConfig(config);
  await checkPackage('@carverry/helper');
  // TODO: 初始化成功后提示；要不要给项目script字段注入脚本？
}

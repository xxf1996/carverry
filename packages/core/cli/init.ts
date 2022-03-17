import { ProjectConfig } from '../typings/context';
import inquirer from 'inquirer';
import { promises, existsSync } from 'fs';
import { resolve } from 'path';
import { warning } from '../utils/tip.js';
import { getContext } from '../server/project.js';
import { getDirname } from '../utils/file.js';
import { execShellOrigin } from '../utils/shell.js';
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
  };
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

async function saveConfig(config: ProjectConfig) {
  const rootDir = process.cwd();
  await promises.writeFile(resolve(rootDir, 'carverry.config.json'), JSON.stringify({
    '$schema': 'https://xiexuefeng.cc/schema/carverry.json',
    ...config,
  }, null, 2), {
    encoding: 'utf-8',
  });
}

export async function startApp() {
  const appDir = resolve(__dirname, '../../app');
  const curDir = resolve(__dirname, '..');
  execShellOrigin(`cd ${curDir} && yarn server`); // 先启动服务器
  await setTimeout(3000); // 服务器和应用分属两个不同的线程
  await execShellOrigin(`cd ${appDir} && yarn dev`); // 再启动可视化应用
}

/**
 * 初始化输出目录及缓存目录等文件
 */
export async function initProjectFiles() {
  const context = await getContext();
  const output = resolve(context.root, context.pageOutDir);
  if (!existsSync(output)) {
    await promises.mkdir(output);
    await promises.writeFile(resolve(output, '.gitignore'), '.cache', {
      encoding: 'utf-8',
    });
  }
  const cache = resolve(output, '.cache');
  if (!existsSync(cache)) {
    await promises.mkdir(cache);
    await promises.copyFile(resolve(__dirname, '../template/empty.vue'), resolve(cache, 'index.vue')); // 空白入口文件
  }
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
  // TODO: 初始化成功后提示；要不要给项目script字段注入脚本？
}

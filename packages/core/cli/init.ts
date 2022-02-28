import { ProjectConfig } from '../typings/context';
import inquirer from 'inquirer';
import { promises } from 'fs';
import { resolve } from 'path';

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
  await promises.writeFile(resolve(rootDir, 'carverry.config.json'), JSON.stringify(config, null, 2), {
    encoding: 'utf-8',
  });
}

/**
 * 初始化项目配置
 * @param useDefault 是否使用默认配置
 */
export async function initConfig(useDefault = false) {
  // TODO: 是否已存在配置文件，存在则提示无需初始化
  let config = getDefaultConfig();
  if (!useDefault) {
    config = await getUserConfig();
  }
  await saveConfig(config);
}

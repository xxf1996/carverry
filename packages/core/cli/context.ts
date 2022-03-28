import { promises, existsSync } from 'fs';
import { resolve } from 'path';
import { saveContext } from '../server/project.js';
import { AliasPath, ProjectConfig, ProjectContext } from '../typings/context';
import { warning } from '../utils/tip.js';
import { getDefaultConfig } from './init.js';

function getProjectAlias(): AliasPath {
  // 从tsconfig.json或vite.config文件自动解析
  return {};
}

export async function updatePprojectContext(cliConfig: Partial<ProjectConfig> = {}) {
  const rootDir = process.cwd();
  const configPath = resolve(rootDir, 'carverry.config.json');
  if (!existsSync(configPath)) {
    warning('没有发现配置文件，请先执行carverry init命令');
    return Promise.reject(new Error('没有发现配置文件，请先执行carverry init命令'));
  }
  const configSource = await promises.readFile(configPath, {
    encoding: 'utf-8',
  });
  const config: ProjectConfig = Object.assign(getDefaultConfig(), JSON.parse(configSource), cliConfig, {
    port: Number(cliConfig.port),
  }); // 优先级：默认配置 < 项目配置文件 < 命令行参数
  const context: ProjectContext = {
    ...config,
    root: rootDir,
    alias: getProjectAlias(),
  };
  // 保存上下文到lowdb
  await saveContext(context);
}

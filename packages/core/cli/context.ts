import { promises, existsSync } from 'fs';
import { resolve } from 'path';
import { saveContext } from '../server/project.js';
import { AliasPath, ProjectConfig, ProjectContext } from '../typings/context';
import { getDefaultConfig } from './init.js';

function getProjectAlias(): AliasPath {
  // TODO: 从tsconfig.json或vite.config文件自动解析
  return {};
}

export async function updatePprojectContext(cliConfig: Partial<ProjectConfig> = {}) {
  const rootDir = process.cwd();
  const configPath = resolve(rootDir, 'carverry.config.json');
  if (!existsSync(configPath)) {
    // TODO: 警告x
    return;
  }
  const configSource = await promises.readFile(configPath, {
    encoding: 'utf-8',
  });
  const config: ProjectConfig = Object.assign(getDefaultConfig(), JSON.parse(configSource), cliConfig, {
    port: Number(cliConfig.port),
  });
  const context: ProjectContext = {
    ...config,
    root: rootDir,
    alias: getProjectAlias(),
  };
  // 保存上下文到lowdb
  await saveContext(context);
}
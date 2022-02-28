import { promises, existsSync } from 'fs';
import { resolve } from 'path';
import { AliasPath, ProjectConfig, ProjectContext } from '../typings/context';
import { getDefaultConfig } from './init';

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
  const config: ProjectConfig = Object.assign(getDefaultConfig(), JSON.parse(configSource), cliConfig);
  const context: ProjectContext = {
    ...config,
    root: rootDir,
    alias: getProjectAlias(),
  };
  // TODO: 保存上下文到lowdb
  console.log(context);
}

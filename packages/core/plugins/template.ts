import { TemplateInfo } from '@carverry/app/src/typings/editor';
import { getContext } from '../server/project.js';
import { resolve } from 'path';
import { existsSync, readdirSync } from 'fs';
import { mkdir, writeFile, readFile } from 'fs/promises';
import { promiseError } from '../utils/tip.js';
import { getFileName } from '../utils/file.js';

async function checkTemplateRoot() {
  const context = await getContext();
  const templateRoot = resolve(context.root, context.pageOutDir, '.template');
  if (!existsSync(templateRoot)) {
    await mkdir(templateRoot);
  }
}

async function getTemplateRoot() {
  const context = await getContext();
  return resolve(context.root, context.pageOutDir, '.template');
}

/**
 * 新增一个本地模板
 * @param info 模板信息
 */
export async function addTemplate(info: TemplateInfo) {
  await checkTemplateRoot();
  const rootDir = await getTemplateRoot();
  const templateDir = resolve(rootDir, info.name);
  if (existsSync(templateDir)) {
    return promiseError(`【${info.name}】模板已存在！`);
  }
  await mkdir(templateDir);
  let coverPath = '';
  if (info.cover) {
    const img = Buffer.from(info.cover, 'base64');
    coverPath = 'cover.jpg';
    await writeFile(resolve(templateDir, coverPath), img);
  }
  await writeFile(resolve(templateDir, 'template.config.json'), JSON.stringify({
    type: info.type || '',
    desc: info.desc || '',
    cover: coverPath,
    config: info.config,
  }, null, 2), {
    encoding: 'utf-8',
  });
}

/**
 * 获取项目中的本地模板
 */
export async function getTemplates(): Promise<TemplateInfo[]> {
  await checkTemplateRoot();
  const rootDir = await getTemplateRoot();
  const dirs = readdirSync(rootDir, {
    encoding: 'utf-8',
  }).map((child) => resolve(rootDir, child));
  const templates = await Promise.all(dirs.map(async (dir) => {
    const configPath = resolve(dir, 'template.config.json');
    if (!existsSync(configPath)) {
      return promiseError('没有发现配置文件！');
    }
    const fileSource = await readFile(configPath, {
      encoding: 'utf-8',
    });
    let cover = '';
    const fileInfo = JSON.parse(fileSource);
    try {
      if (fileInfo.cover && existsSync(resolve(dir, fileInfo.cover))) {
        cover = await readFile(resolve(dir, fileInfo.cover), {
          encoding: 'base64',
        });
      }
      const info: TemplateInfo = {
        name: getFileName(dir),
        config: fileInfo.config,
        desc: fileInfo.desc,
        type: fileInfo.type,
        cover,
      };
      return info;
    } catch (err) {
      return promiseError((err as Error).message);
    }
  }));
  return templates;
}

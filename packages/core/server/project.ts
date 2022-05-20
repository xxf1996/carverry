import { ProjectContext } from '../typings/context';
import { PreviewParams } from '../typings/server';
import { db } from './common.js';
import { resolve } from 'path';
import { existsSync, mkdirSync, readdirSync } from 'fs';
import { writeFile, readFile } from 'fs/promises';
import { emptyBlock, emptyPage, generateFile } from '../plugins/output.js';
import { ComponentOption } from '@carverry/app/src/typings/editor';
import { isDir } from '../utils/file.js';

const BLOCK_CONFIG = 'block.config.json';

export async function saveContext(context: ProjectContext) {
  await db.read();
  if (db.data?.context) {
    db.data.context = context;
  } else {
    db.data = {
      context,
    };
  }
  await db.write();
}

/**
 * 获取当前项目上下文信息
 */
export async function getContext(): Promise<ProjectContext> {
  await db.read();
  if (db.data?.context) {
    return db.data.context;
  }
  return Promise.reject(new Error('没有上下文信息'));
}

export async function getBlockDir() {
  const context = await getContext();
  return resolve(context.root, context.pageOutDir);
}

export async function updatePreview(params: PreviewParams) {
  const context = await getContext();
  const cacheDir = resolve(context.root, context.pageOutDir, '.cache');
  const blockDir = resolve(context.root, context.pageOutDir);
  if (params.block && params.option?.path) {
    // 同步更新预览输出，且同步更新block配置文件
    const configPath = resolve(blockDir, params.block, BLOCK_CONFIG);
    if (existsSync(configPath)) {
      await writeFile(configPath, JSON.stringify(params.option, null, 2), {
        encoding: 'utf-8',
      });
      await generateFile(resolve(cacheDir), params.option, true); // 输出到缓存目录，进行预览
    }
  } else if (params.block) {
    emptyBlock(cacheDir);
  } else if (!params.block) {
    emptyPage(cacheDir);
  }
}

export async function generateBlock(params: Required<PreviewParams>) {
  const blockDir = await getBlockDir();
  await generateFile(resolve(blockDir, params.block), params.option, false);
}

export async function getBlocks(): Promise<string[]> {
  const blockDir = await getBlockDir();
  const dirs = readdirSync(blockDir, {
    encoding: 'utf-8',
  }).map((child) => resolve(blockDir, child));
  const blocks: string[] = [];

  for (const dir of dirs) {
    const res = await isDir(dir);
    if (res && existsSync(resolve(dir, BLOCK_CONFIG))) {
      const paths = dir.split('/');
      blocks.push(paths[paths.length - 1]);
    }
  }

  return blocks;
}

export async function addBlock(name: string) {
  const blocks = await getBlocks();
  if (blocks.includes(name)) {
    return Promise.reject(new Error('Block已存在！'));
  }
  const blockDir = await getBlockDir();
  const targetDir = resolve(blockDir, name);
  if (existsSync(targetDir)) {
    return Promise.reject(new Error('Block目录已存在！'));
  }
  mkdirSync(targetDir);
  await writeFile(resolve(targetDir, BLOCK_CONFIG), '{}', {
    encoding: 'utf-8',
  });
}

export async function getBlockConfig(name: string) {
  const blockDir = await getBlockDir();
  if (!existsSync(resolve(blockDir, name))) {
    return Promise.reject(new Error('Block目录不存在！'));
  }
  const configPath = resolve(blockDir, name, BLOCK_CONFIG);
  if (!existsSync(configPath)) {
    return Promise.reject(new Error('Block配置文件不存在！'));
  }
  const content = await readFile(configPath, {
    encoding: 'utf-8',
  });
  try {
    const config: ComponentOption = JSON.parse(content);
    return config;
  } catch (e) {
    return Promise.reject(e);
  }
}

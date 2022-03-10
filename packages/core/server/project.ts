import { ProjectContext } from '../typings/context';
import { PreviewParams } from '../typings/server';
import { db } from './common.js';
import { resolve } from 'path';
import { emptyBlock, emptyPage } from '../plugins/output.js';

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

export async function updatePreview(params: PreviewParams) {
  const context = await getContext();
  const cacheDir = resolve(context.root, context.pageOutDir, '.cache');
  if (params.block && params.option) {
    // TODO: 同步更新预览输出
  } else if (params.block) {
    emptyBlock(cacheDir);
  } else if (!params.block) {
    emptyPage(cacheDir);
  }
}

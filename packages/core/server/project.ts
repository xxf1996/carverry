import { ProjectContext } from '../typings/context';
import { db } from './common.js';

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
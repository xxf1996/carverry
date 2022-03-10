import { getDirname } from '../utils/file.js';
import { resolve } from 'path';
import { rmSync, copyFileSync } from 'fs';

// eslint-disable-next-line @typescript-eslint/naming-convention
const __dirname = getDirname(import.meta.url);
const templateDir = resolve(__dirname, '../template');

function cleanDir(dir: string) {
  // TODO：怎样在保存index.vue不被删除的前提下删除文件下其他文件？或者干脆就这样？也许可以整个文件夹进行替换？
  rmSync(dir, {
    recursive: true,
    force: true,
  });
}

export function emptyPage(cacheDir: string) {
  // cleanDir(cacheDir);
  copyFileSync(resolve(templateDir, 'empty.vue'), resolve(cacheDir, 'index.vue'));
}

export function emptyBlock(cacheDir: string) {
  // cleanDir(cacheDir);
  copyFileSync(resolve(templateDir, 'empty-block.vue'), resolve(cacheDir, 'index.vue'));
}

import { dirname } from 'path';
import { fileURLToPath } from 'url';
import glob from 'glob';
import { lstat } from 'fs/promises';
import lodash from 'lodash';

const { capitalize } = lodash;

/**
 * 在ESM模块中获取`__dirname`等效变量
 * @param relativePath `import.meta.url`
 * @returns `__dirname`
 */
export function getDirname(relativePath: string): string {
  return dirname(fileURLToPath(relativePath));
}

export function globAsync(pattern: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    glob(pattern, (err, files) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(files);
    });
  });
}

export function getRelativePath(root: string, filePath: string): string {
  const paths = filePath.split(root);
  const other = paths[1];
  if (!other) {
    return '';
  }
  return other.startsWith('/') ? other.slice(1) : other;
}

export function getFileName(filePath: string, fullName = true): string {
  const paths = filePath.split('/');
  const full = paths[paths.length - 1];
  if (fullName) {
    return full;
  }
  const info = full.split('.');
  return info[0];
}

export async function isDir(filePath: string) {
  const stat = await lstat(filePath);
  return stat.isDirectory();
}

export function toCamlCase(str: string) {
  return str.split('-').map((word) => capitalize(word)).join('');
}

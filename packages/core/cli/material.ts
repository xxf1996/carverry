import { resolve } from 'path';
import { existsSync } from 'fs';
import { rm, mkdir } from 'fs/promises';
import fse from 'fs-extra';

export async function buildMaterialProject(rootDir: string) {
  // TODO: 项目结构合法性校验
  const outputDir = resolve(rootDir, 'dist');
  if (existsSync(outputDir)) {
    await rm(outputDir, {
      recursive: true, // rm -rf
    });
  }
  await mkdir(outputDir);
  await fse.copy(resolve(rootDir, 'src'), outputDir);
}
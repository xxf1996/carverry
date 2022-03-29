import { resolve, relative, dirname } from 'path';
import { existsSync } from 'fs';
import { rm, mkdir, writeFile, readdir, copyFile } from 'fs/promises';
import fse from 'fs-extra';
import replace from 'replace-in-file';
import { createRequire } from 'module';
import { getDirname, getFileName, globAsync, isDir, toCamlCase } from '../utils/file.js';
import { MaterialItem, MaterialItemConfig } from '@carverry/app/src/typings/editor';
import lodash from 'lodash';
import inquirer from 'inquirer';
import { getComponentDoc } from '../plugins/component-meta.js';
import { info, promiseError, success } from '../utils/tip.js';
import { elementPlusTransformer } from '../plugins/transformer.js';

const require = createRequire(import.meta.url);
// eslint-disable-next-line @typescript-eslint/naming-convention
const __dirname = getDirname(import.meta.url);
const { capitalize } = lodash;

function getReplace(key: string, val: string[]) {
  const pattern = new RegExp(`(?<=from )'${key.replace('*', '(.+)')}'`, 'g');
  const replacePath = (match: string, rootDir: string, curPath: string) => {
    const curDir = dirname(curPath);
    const targetPath = resolve(rootDir, val[0].replace('src', 'dist').replace('*', match));
    return relative(curDir, targetPath);
  };

  return {
    pattern,
    replacePath,
  };
}

function getAliasPaths(rootDir: string) {
  const tsconfig = require(resolve(rootDir, 'tsconfig.json'));
  const keys = Object.keys(tsconfig.compilerOptions.paths || {});
  if (keys.length === 0) {
    return [];
  }
  return keys.map((key) => getReplace(key, tsconfig.compilerOptions.paths[key]));
}

async function generateMaterialInfo(dir: string, sourceDir: string, packageName: string) {
  const configPath = resolve(dir, 'carverry.material.json');
  if (!existsSync(configPath)) {
    return Promise.reject(new Error(`没有发现物料【${dir}】的配置文件！`));
  }
  const config: MaterialItemConfig = require(configPath);
  const curDir = getFileName(dir); // 最后一级目录
  const defaultEntry = curDir.split('-').map((word) => capitalize(word)).join('');
  const entryPath = resolve(dir, `${config.entry || defaultEntry}.vue`);
  if (!existsSync(entryPath)) {
    return Promise.reject(new Error(`没有发现物料【${dir}】的入口文件！`));
  }
  const doc = await getComponentDoc(entryPath, sourceDir);
  const meta: MaterialItem['meta'] = {
    doc,
    name: defaultEntry,
    path: `package://${packageName}#${curDir}`,
  };
  await writeFile(resolve(dir, 'carverry.meta.json'), JSON.stringify(meta, null, 2), {
    encoding: 'utf-8',
  });
}

export async function buildMaterialProject(rootDir: string) {
  // TODO: 项目结构合法性校验
  const packageInfo = require(resolve(rootDir, 'package.json'));
  if (!packageInfo.name) {
    return Promise.reject(new Error('没有发现包名！'));
  }
  const outputDir = resolve(rootDir, 'dist');
  if (existsSync(outputDir)) {
    await rm(outputDir, {
      recursive: true, // rm -rf
    });
  }
  await mkdir(outputDir);
  await fse.copy(resolve(rootDir, 'src'), outputDir);
  const replaces = getAliasPaths(rootDir);
  if (replaces.length > 0) {
    console.log(replaces);
    const filePattern = [
      resolve(outputDir, '**/*.vue'),
      resolve(outputDir, '**/*.ts'),
    ];
    const files = await globAsync(`{${filePattern.join(',')}}`);
    for (const replaceItem of replaces) { // 替换alias path
      await Promise.all(files.map((filePath) => replace.replaceInFile({
        files: filePath,
        from: replaceItem.pattern,
        to: (...args) => {
          const relativePath = replaceItem.replacePath(args[1], rootDir, filePath);
          console.log(relativePath);
          return `'${relativePath}'`;
        },
      })));
    }
  }
  const materials = await readdir(resolve(outputDir, 'materials'));
  for (const material of materials) {
    const materialPath = resolve(outputDir, 'materials', material);
    const res = await isDir(materialPath);
    if (!res) {
      continue;
    }
    generateMaterialInfo(materialPath, outputDir, packageInfo.name);
  }
}

export async function initMaterialDir(rootDir: string, name: string) {
  const materialRoot = resolve(rootDir, 'src', 'materials');
  if (!existsSync(materialRoot)) {
    return Promise.reject(new Error('没有发现物料文件夹！'));
  }
  const targetDir = resolve(materialRoot, name);
  if (existsSync(targetDir)) {
    return Promise.reject(new Error(`物料【${name}】已存在！`));
  }
  const componentName = toCamlCase(name);
  await mkdir(targetDir);
  await writeFile(resolve(targetDir, 'carverry.material.json'), JSON.stringify({
    '$schema': 'https://xiexuefeng.cc/schema/carverry-material.json',
    title: componentName,
    desc: `【${componentName}】的描述`,
    type: 'test',
  }, null, 2), {
    encoding: 'utf-8',
  });
  await writeFile(resolve(targetDir, `${componentName}.vue`), '', {
    encoding: 'utf-8',
  });
  await writeFile(resolve(targetDir, 'index.ts'), `import ${componentName} from './${componentName}.vue';\nexport default ${componentName};\n`, {
    encoding: 'utf-8',
  });
  success(`物料【${name}】初始化完成！`);
}

/**
 * 第三方UI库转换
 * @param rootDir 物料根目录
 */
export async function transformPackage(rootDir: string) {
  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'package',
      choices: [
        {
          name: 'Element-plus',
          value: 'element',
        },
      ],
    },
  ]);
  switch (answers.package) {
    case 'element':
      await elementPlusTransformer(rootDir);
      break;
    default:
      break;
  }
}

export async function initMaterialStory(dir: string, name: string, storyDir: string) {
  const configPath = resolve(dir, 'carverry.material.json');
  if (!existsSync(configPath)) {
    return promiseError(`【${name}】没有发现carverry.material.json！`);
  }
  const config: MaterialItemConfig = require(configPath);
  const defaultEntry = toCamlCase(name);
  const entryName = config.entry || defaultEntry;
  const entryPath = resolve(dir, `${entryName}.vue`);
  if (!existsSync(entryPath)) {
    return promiseError(`【${name}】没有发现入口文件！`);
  }
  const storyPath = resolve(storyDir, `${entryName}.stories.ts`);
  if (existsSync(storyPath)) {
    info(`【${storyPath}】已存在！`);
    return;
  }
  const content = `import ${entryName} from '${relative(storyDir, entryPath)}';
import { basicTemplate, getComponentPropInfo } from './tool';

type ${entryName}Props = InstanceType<typeof ${entryName}>['$props'];

export default {
  title: '${config.type}/${entryName}',
  component: ${entryName},
  argTypes: getComponentPropInfo(${entryName}.props, ${entryName}['__docgenInfo']),
};

const Template = basicTemplate<${entryName}Props>(${entryName});

export const Basic = Template.bind({});
Basic.args = {};
Basic.storyName = '基本使用';
`;
  await writeFile(storyPath, content, {
    encoding: 'utf-8',
  });
  success(`【${storyPath}】已生成！`);
}

export async function buildStory(rootDir: string) {
  const sourceDir = resolve(rootDir, 'src');
  const storyDir = resolve(sourceDir, 'stories');
  if (!existsSync(storyDir)) {
    await mkdir(storyDir);
  }
  const tool = resolve(storyDir, 'tool.ts');
  if (!existsSync(tool)) {
    await copyFile(resolve(__dirname, '..', 'template', 'story-tool.ts'), tool);
  }
  const materials = await readdir(resolve(sourceDir, 'materials'));
  for (const name of materials) {
    await initMaterialStory(resolve(sourceDir, 'materials', name), name, storyDir);
  }
}

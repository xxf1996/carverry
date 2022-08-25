import { compileScript, parse } from '@vue/compiler-sfc';
import { resolve } from 'path';
import { RealFileSystemHost } from '@ts-morph/common';
import { Project } from 'ts-morph';
import { globAsync } from '../../utils/file.js';
import { existsSync, readFileSync } from 'fs';

// const projectRoot = '/Users/xuefengxie/Desktop/project/yimonitor-frontend';

/** 可以获取到嵌套泛型对象类型的最直接表达：https://stackoverflow.com/questions/57683303/how-can-i-see-the-full-expanded-contract-of-a-typescript-type/57683652#57683652 */
const expandType = 'type CarverryExpand<T> = T extends infer O ? { [K in keyof O]: O[K] } : never;';

/** 通过自定义fileSystem来实现对非ts源码生成对应的ts结构的目的 */
class CustomFS extends RealFileSystemHost {
  constructor(private projectRoot: string) {
    super();
  }

  private isVue(filePath: string): boolean {
    // 通过vue.ts后缀来匹配对应的.vue文件；因为直接添加.vue文件作为sourceFile ts-morph目前还不支持……
    return filePath.includes(resolve(this.projectRoot, 'src')) && /.+\.vue\.ts$/.test(filePath);
  }

  private getRealPath(filePath: string): string {
    return this.isVue(filePath) ? filePath.split('.ts')[0] : filePath;
  }

  readFileSync(filePath: string, encoding?: string): string {
    const realPath = this.getRealPath(filePath);
    const originContent = readFileSync(realPath, {
      encoding: (encoding || 'utf-8') as BufferEncoding,
    });
    // 当匹配到vue文件时，先通过@vue/compiler-sfc来转换为ts
    if (this.isVue(filePath)) {
      // console.log('readFileSync vue.ts', realPath);
      const vueAST = parse(originContent, {
        sourceRoot: this.projectRoot,
        filename: realPath,
      });
      if (!vueAST.descriptor.script && !vueAST.descriptor.scriptSetup) {
        // console.log('empty script', realPath);
        return '';
      }
      const script = compileScript(vueAST.descriptor, {
        id: realPath,
      });

      let content = script.content;
      const componentOption = content.match(/defineComponent\((.+)\)/s);

      /**
       * 通过截取defineComponent的option对象字面量，方便后续进一步推断出精准的props type；
       */
      if (componentOption && componentOption.length > 1) {
        const option = componentOption[1];
        const extraInfo = `${expandType}\nconst __carverryComponentOption = ${option};\ntype CarverryComponentProps = CarverryExpand<ExtractPropTypes<(typeof __carverryComponentOption)['props']>>;`;
        content = content.replace(/(export default.+defineComponent\(.+\))/s, `${extraInfo}\n$1`);
        content = `import { ExtractPropTypes } from 'vue';\n${content}`;
        // content = content.replace(/defineComponent\(.+\)/s, 'defineComponent(__carverryComponentOption)');
      }

      return content;
    }
    return originContent;
  }

  fileExistsSync(filePath: string): boolean {
    return existsSync(this.getRealPath(filePath));
  }

  directoryExistsSync(dirPath: string): boolean {
    return this.fileExistsSync(dirPath);
  }
}

async function addVueSource(projectRoot: string, project: Project) {
  const filePaths = await globAsync(`${projectRoot}/src/**/*.vue`);
  const vuePaths = filePaths.map((filePath) => `${filePath}.ts`);
  vuePaths.forEach((vuePath) => {
    project.addSourceFileAtPath(vuePath); // 单个进行添加就可以避免被过滤
  });
  // project.addSourceFilesAtPaths(vuePaths) // 不知道为啥用addSourceFilesAtPaths进行批量添加会导致某些文件被过滤掉
  project.resolveSourceFileDependencies();
}

/**
 * 构建一个vue + ts的语言服务器，将vue也识别成ts文件，共享编译上下文
 * @param projectRoot 项目根目录
 * @returns 
 */
export async function createVueTSProject(projectRoot: string) {
  const fsHost = new CustomFS(projectRoot);
  const project = new Project({
    tsConfigFilePath: resolve(projectRoot, 'tsconfig.json'),
    libFolderPath: resolve(projectRoot, 'node_modules/typescript/lib'),
    fileSystem: fsHost,
    skipAddingFilesFromTsConfig: true,
    skipFileDependencyResolution: true,
  });
  project.addSourceFilesAtPaths([resolve(projectRoot, 'src/**/*.ts')]);
  await addVueSource(projectRoot, project);

  return project;
}



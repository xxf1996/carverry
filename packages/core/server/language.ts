import { Nullable } from '@carverry/app/src/typings/common';
import type { Project } from 'ts-morph';
import { ts } from 'ts-morph';
import { createVueTSProject } from '../plugins/language-server/project.js';
import { getVueFilePropsType } from '../plugins/language-server/vue.js';
import { getContext } from './project.js';

let project: Nullable<Project> = null;
let needUpdate = true;

async function getLangProject() {
  if (needUpdate || !project) {
    const context = await getContext();
    project = await createVueTSProject(context.root);
    needUpdate = false;
  }

  return project;
}

export async function langTest() {
  const langProject = await getLangProject();
  const typeChecker = langProject.getTypeChecker();
  const prop = getVueFilePropsType(langProject, 'MultiChart.vue.ts');
  if (prop) {
    return typeChecker.getTypeText(prop, undefined, ts.TypeFormatFlags.InTypeAlias);
  }

  return 'any(not found)';
}

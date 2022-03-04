import { ProjectContext } from 'packages/core/typings/context';
import type { Router } from 'vue-router';

export async function addCarverryRoute(router: Router) {
  const data = await fetch('http://localhost:3344/context', {
    method: 'get',
  }).then((res) => res.json() as Promise<ProjectContext>);
  const source = [data.root, data.sourceDir].join('/');
  const output = [data.root, data.pageOutDir].join('/');
  const cacheDir = `.${output.split(source)[1]}/.cache`;
  router.addRoute({
    path: '/carverry-preview',
    name: 'CarverryPreview',
    component: () => import(cacheDir),
  });
}

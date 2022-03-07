import { ProjectContext } from 'packages/core/typings/context';
import type { Router } from 'vue-router';

export async function addCarverryRoute(router: Router) {
  const data = await fetch('http://localhost:3344/context', {
    method: 'get',
  }).then((res) => res.json() as Promise<ProjectContext>);
  const source = [data.root, data.sourceDir].join('/');
  const output = [data.root, data.pageOutDir].join('/');
  const cacheDir = `./${output.split(source)[1]}/.cache/index.vue`; // FIXME: 解决相对路径
  router.addRoute({
    path: '/carverry-preview',
    name: 'CarverryPreview',
    component: () => import(cacheDir),
  });
  setTimeout(() => {
    router.push({
      name: 'CarverryPreview',
    });
  }, 1000);
}

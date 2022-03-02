import { App } from 'vue';
import { createRouter, createWebHistory, RouterView } from 'vue-router';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: RouterView,
      redirect: '/editor',
      children: [
        {
          path: '/editor',
          name: 'Editor',
          component: () => import('@/views/editor/TheIndex.vue'),
        },
      ],
    },
  ],
});

export default router;

/** 使用vue-router */
export function useRouter(app: App): void {
  app.use(router);
}

## @carverry/helper ![img](https://img.shields.io/npm/v/@carverry/helper)

这个包主要承接用于给**本地项目**使用的辅助函数；



### API

#### addCarverryRoute

```ts
/**
 * 注册carverry预览路由
 * @param router 路由实例
 * @param afterInit 注册完路由后的事件钩子，默认会直接跳转到预览页；如果要增加自定义路由参数可以自行使用钩子；
 * @param entry 预览路由入口文件，默认为`/src/blocks/.cache/index.vue`
 */
async function addCarverryRoute(router: Router, afterInit?: () => void, entry = '/src/blocks/.cache/index.vue')
```

- `afterInit`：在第一次进入预览路由时，会先进行动态的路由挂载，然后在挂载完成后再进入预览路由，而`afterInit`则会在**首次进入预览路由之前先被执行**，用于支持对路由参数进行各种设定，以便适配本地项目中可能存在的权限鉴定或自定义路由参数等业务逻辑；

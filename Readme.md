## carverry ![carverry](https://img.shields.io/npm/v/@carverry/core.svg)

这是一个比较激进的可视化搭建方案，适用于`vue3.2+/TS/vite`技术栈的项目；目的在于快速搭建页面



## 快速开始

首先全局安装 `ts-node`、`@carverry/app`、`@carverry/core`；

```bash
npm i -g ts-node @carverry/app @carverry/core #or
yarn global add ts-node @carverry/app @carverry/core #or
pnpm add -g ts-node @carverry/app @carverry/core
```

然后在项目命令行进行初始化：

```bash
carverry init
```

然后按照交互式命令进行对应选项的配置：

![image](./docs/assets/carverry-1.jpg)

如果想全部使用默认配置，可以使用`-y`选项来完成：

```bash
carverry init -y
```

完成初始化后，就可以启动可视化搭建应用了：

```bash
carverry start #or
carverry #可以直接省掉start命令，因为默认命令就是start
```


[TOC]

## @carverry/core

这个包承接了`carverry`的命令行、`UI`和本地应用直接的通信服务、核心插件等相关业务；

### 项目结构

- `cli`：脚手架相关功能；
- `plugins`：核心插件，主要处理`IO`相关的功能；
- `server`：包含一个迷你`json`数据库文件、基于`websocket`的通信服务和一个纯`http`服务（给`@carverry/app`提供相应信息的获取和交互）；
- `template`：模板文件，用于初始化；
- `typings`：`TS`类型定义；
- `utils`：项目通用工具函数；

### 技术栈

- `ts-node`：`node`的一个`TS`运行时，即可以在`node`环境下直接运行`TS`；
- [`farrow`]((https://github.com/farrow-js/farrow))：基于`TS`的轻量化服务框架，语法简单；
- `ws`：提供`websocket`相关服务；
- `commander`：定制命令行参数；
- `inquirer`：可交互式命令行；
- `ora`：命令行`loading`状态；
- `chalk`：彩色，格式化命令行输出；



## 基于`ts-node`的纯`ESM`写法

整个项目基于`ESM`写法，所以有些地方需要注意一下；

- [ESM support: soliciting feedback · Issue #1007 · TypeStrong/ts-node](https://github.com/TypeStrong/ts-node/issues/1007)：`ts-node`官方指南
- [Pure ESM package](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c)：万恶之源，由于要使用这个`lowdb`包，这个包最新版本只提供纯`ESM`版本
- [How to import JSON files in ES modules (Node.js) | Stefan Judis Web Development](https://www.stefanjudis.com/snippets/how-to-import-json-files-in-es-modules-node-js/)：如何在`node esm`模式下加载json文件

### 限制

- 不能直接使用`__dirname`变量
- `--experimental-loader`选项（指定`node loader`）仍是一个<font color=#f00>实验选项</font>，在未来版本可能会有改变；






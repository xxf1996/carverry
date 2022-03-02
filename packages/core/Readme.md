## 基于ts-node的纯ESM写法

- [ESM support: soliciting feedback · Issue #1007 · TypeStrong/ts-node](https://github.com/TypeStrong/ts-node/issues/1007)：`ts-node`官方指南
- [Pure ESM package](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c)：万恶之源，由于要使用这个`lowdb`包，这个包最新版本只提供纯`ESM`版本
- [How to import JSON files in ES modules (Node.js) | Stefan Judis Web Development](https://www.stefanjudis.com/snippets/how-to-import-json-files-in-es-modules-node-js/)：如何在node esm模式下加载json文件

### 限制

- 不能直接使用`__dirname`变量
- `--experimental-loader`选项（指定`node loader`）仍是一个<font color=#f00>实验选项</font>，在未来版本可能会有改变；



## 服务

- [farrow-js/farrow: A Type-Friendly Web Framework for Node.js](https://github.com/farrow-js/farrow)



## json schema

可以制定一个`schema`，来限定和校验`json`配置文件；

- [JSON Schema | The home of JSON Schema](https://json-schema.org/)
- https://json.schemastore.org/tsconfig


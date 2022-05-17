## 发布事项

- 由于发布带`scope`的包需要对应的组织，所以就创建了一个[组织](https://www.npmjs.com/settings/carverry/packages)（`@xxx`对应的组织就是`xxx`）；

- 发布带`scope`的包时，`npm`默认会认为是私有包，而目前发布私有包在`npm`是一个付费功能；如果只是想将其发布为公共包，那么加上`--access public`即可[^1]（<font color=#f00>第一次发布</font>时必须加上），如：

  ```bash
  yarn publish --access public #or
  npm publish --access public
  ```

### lerna 单独发包

由于使用`lerna publish`命令发包时，默认会把所有的包进行发布，不管这个包是否需要发布；但是有一个**折中**的办法：

- 先把不需要发布的包里面的`package.json`设置`private: true`[^2]；
- 然后执行`lerna publish --no-private`，带上`--no-private`是由于`publish`默认[^2]也会对私有包进行版本升级，使用`--no-private`在版本升级时会跳过私有包[^3][^4]；

### 撤销发布

如果发包之后发现有错误，想要<font color=#f00>及时撤回</font>，可以使用`unpublish`命令：

```bash
npm unpublish package-name@version
```





## 基于workspace多包管理

- [结合 lerna 和 yarn workspace 管理多项目工作流 - SegmentFault 思否](https://segmentfault.com/a/1190000025173538)
- [changesets/changesets: 🦋 A way to manage your versioning and changelogs with a focus on monorepos](https://github.com/changesets/changesets)
- [lerna+yarn workspace+monorepo项目的最佳实践_小平果118的博客-CSDN博客_monorepo yarn](https://blog.csdn.net/i10630226/article/details/99702447)：主要参考这个








[^1]: [node.js - How to publish NPM Scoped Packages / NPM scope not found? - Stack Overflow](https://stackoverflow.com/questions/43824012/how-to-publish-npm-scoped-packages-npm-scope-not-found)
[^2]: https://github.com/lerna/lerna/issues/1692#issuecomment-426005544
[^3]: https://github.com/lerna/lerna-changelog/issues/128#issuecomment-706747899
[^4]: https://github.com/lerna/lerna/tree/main/commands/version#--no-private

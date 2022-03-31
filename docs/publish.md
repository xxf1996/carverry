## 发布事项

- 由于发布带`scope`的包需要对应的组织，所以就创建了一个[组织](https://www.npmjs.com/settings/carverry/packages)（`@xxx`对应的组织就是`xxx`）；

- 发布带`scope`的包时，`npm`默认会认为是私有包，而目前发布私有包在`npm`是一个付费功能；如果只是想将其发布为公共包，那么加上`--access public`即可[^1]，如：

  ```bash
  yarn publish --access public
  ```

- 





[^1]: [node.js - How to publish NPM Scoped Packages / NPM scope not found? - Stack Overflow](https://stackoverflow.com/questions/43824012/how-to-publish-npm-scoped-packages-npm-scope-not-found)

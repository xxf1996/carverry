## 基本操作

### Block

`Block`是单个可视化操作区域，其本质上对应一个配置文件，即组件树；因此可以把一个`Block`完全**等价于一个`Vue`组件**，只不过组件功能有大有小，所以`Block`代表的功能实际上取决于使用者的目的，可以把`Block`当做**页面**来管理，也可以只是一个**局部区域**（模块）；

#### 创建Block

<img src="./assets/basic/1.jpg" alt="img" style="zoom: 50%;" />

在顶部找到【新建Block】按钮，填写表单即可创建一个新的`Block`；

<img src="./assets/basic/2.jpg" alt="img" style="zoom:33%;" />

#### 切换/选择Block

<img src="./assets/basic/3.jpg" alt="img" style="zoom:50%;" />

#### 删除Block

目前没有提供该功能，暂时可以自己手动从`Block`保存目录进行删除；



### 可视化交互

#### 从物料库选中组件进行插入

<img src="assets/basic/4.jpg" alt="img" style="zoom:50%;" />

点击即可打开物料库面板，物料库由两个部分组成：

- **本地组件**：直接从源码目录获取项目中的`Vue`文件；
- **物料包**：以包的形式发布的公共组件；

##### 本地组件

本地组件通过**目录树**的形式进行匹配，以源码目录为根目录，而`src/some/path/*`就代表这一级目录下的所有`Vue`文件，如：

<img src="./assets/basic/5.jpg" alt="img" style="zoom:50%;" />



##### 物料包





#### 从本地模板选中模板进行插入




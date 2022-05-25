# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [0.3.0](https://github.com/xxf1996/carverry/compare/@carverry/app@0.2.0...@carverry/app@0.3.0) (2022-05-25)


### Bug Fixes

* **app-plugin:** 实时更新预览出现的异常请求数量,导致主线程的阻塞 ([7b5ebf5](https://github.com/xxf1996/carverry/commit/7b5ebf537382f94e91abe27363f8969c7f38708a)), closes [#3](https://github.com/xxf1996/carverry/issues/3)
* **app:** input样式适配 ([2d36ce9](https://github.com/xxf1996/carverry/commit/2d36ce948bb675e2374aedeeebcba9207a03bd7d))
* **app:** websocket通信频率太高,阻塞事件 ([b88d557](https://github.com/xxf1996/carverry/commit/b88d557754ffb4adb5db93b3279ec11e9177c78f)), closes [#1](https://github.com/xxf1996/carverry/issues/1)
* **app:** 切换block没有重新开始记录配置历史 ([d4a1954](https://github.com/xxf1996/carverry/commit/d4a1954d3b3246357205e285ba836ce56296bc64))
* **app:** 切换block清空组件选中状态 ([ec16325](https://github.com/xxf1996/carverry/commit/ec163253c91260b37b77f776f7d95134d968f483))
* **app:** 去掉blockOption的localstorage存储 ([ea4c898](https://github.com/xxf1996/carverry/commit/ea4c8987fcf2893fbac4a0d9512e1fe3d301d86b))
* **app:** 更新element-plus ([970d446](https://github.com/xxf1996/carverry/commit/970d446d829fc42936d6154054750cfdef927568))


### Features

* **app:** 在路由增加block参数，快速导航 ([49c4798](https://github.com/xxf1996/carverry/commit/49c4798b4cbb9c095b45455728ad59055075e75e)), closes [#5](https://github.com/xxf1996/carverry/issues/5)
* **app:** 增加保存模板表单 ([0264118](https://github.com/xxf1996/carverry/commit/0264118066a753476ffb98227dad1d3c49243a65))
* **app:** 增加最近使用路径便捷操作 ([7c46118](https://github.com/xxf1996/carverry/commit/7c461188955d69f94eae8f981456800347a6940b)), closes [#6](https://github.com/xxf1996/carverry/issues/6)
* **app:** 增加操作文档入口 ([4c67276](https://github.com/xxf1996/carverry/commit/4c67276a7881aaa1c1a5458cd41af742df5702a4)), closes [#17](https://github.com/xxf1996/carverry/issues/17)
* **app:** 增加配置的undo/redo操作 ([5c38d80](https://github.com/xxf1996/carverry/commit/5c38d80e53c315deffd9d3955a98ce13de45f33c)), closes [#4](https://github.com/xxf1996/carverry/issues/4)
* **app:** 插入模板并添加到配置中 ([489bc60](https://github.com/xxf1996/carverry/commit/489bc60ef185550abe1c8d0a133144dc483bcdb0)), closes [#10](https://github.com/xxf1996/carverry/issues/10)
* **app:** 操作按钮加上tooltip说明 ([8f5fe5e](https://github.com/xxf1996/carverry/commit/8f5fe5eb5f2471b9c8c8a2fa2e16f65b1fd48f1f)), closes [#8](https://github.com/xxf1996/carverry/issues/8)
* **app:** 支持本地组件跳转回VSCode ([dcdadd0](https://github.com/xxf1996/carverry/commit/dcdadd086289232cb9f55ee67db34eeafe98ab23)), closes [#14](https://github.com/xxf1996/carverry/issues/14)
* **app:** 显示本地模板列表 ([87a6f4a](https://github.com/xxf1996/carverry/commit/87a6f4a071b3518c2451a56290e7196c60a10025))
* **app:** 校验新建block名称的合理性 ([bd2684b](https://github.com/xxf1996/carverry/commit/bd2684b0d8653083b4e4bc39019595e85945ee7a)), closes [#9](https://github.com/xxf1996/carverry/issues/9)
* **app:** 设计Logo&调整属性编辑相关样式 ([11d32ec](https://github.com/xxf1996/carverry/commit/11d32eca1600e34900b65089d5f3a72d1c5f9339))
* **app:** 调整物料库样式 ([7452880](https://github.com/xxf1996/carverry/commit/745288074e215b0b8a420b494fc8509bce0b9fdc)), closes [#12](https://github.com/xxf1996/carverry/issues/12)
* **app:** 调整组件信息展示和编辑相关UI ([0578802](https://github.com/xxf1996/carverry/commit/0578802699b55368e51785aa493c4d654a1d83ff))
* **app:** 调整编辑相关的b布局 ([f9a9deb](https://github.com/xxf1996/carverry/commit/f9a9deb5bdbf233f0e53861eaa1be9d3f42708d2))
* **app:** 适配只读模式的UI ([0e6eacd](https://github.com/xxf1996/carverry/commit/0e6eacda8b48de57aaa146addd51e9abdc0cc5b2))
* 支持安装物料包 ([9fcc7c9](https://github.com/xxf1996/carverry/commit/9fcc7c9f345e1a0953e0babd67fa64461924802c)), closes [#13](https://github.com/xxf1996/carverry/issues/13)
* 新增模板相关接口&调试接口 ([ed682ec](https://github.com/xxf1996/carverry/commit/ed682ec2bd5b86a037fa7a3149ff079bdbea245e))





# 0.2.0 (2022-04-28)



## 0.1.13 (2022-04-12)


### Features

* **app:** 支持ref绑定 ([269fe54](https://github.com/xxf1996/carverry/commit/269fe540744f85f49718296f70a3709953b76822))



## 0.1.12 (2022-04-07)


### Bug Fixes

* 优化路由加载&初始化editKey ([51fc443](https://github.com/xxf1996/carverry/commit/51fc443e241899128297c030948cdbdab013d3ad))


### Features

* **app:** 优化组件元数据变化处理&路由钩子 ([f682040](https://github.com/xxf1996/carverry/commit/f6820403e38eadd27fb763a29f91c075596d1a6f))
* **app:** 支持刷新项目信息 ([133483b](https://github.com/xxf1996/carverry/commit/133483b14dfddc1b0c5c692730bae59462dfd6cf))



## 0.1.11 (2022-04-07)


### Features

* **app:** 支持重载页面 ([3a896a4](https://github.com/xxf1996/carverry/commit/3a896a40e3b0dd7c33263a865b945fbe86633a62))



## 0.1.10 (2022-04-06)


### Features

* 增加slot skip属性的交互 ([2301d62](https://github.com/xxf1996/carverry/commit/2301d6210353e802e370635a75258e1e604e5068))



## 0.1.9 (2022-04-06)


### Bug Fixes

* **app:** 位置指示条z-index ([a35789b](https://github.com/xxf1996/carverry/commit/a35789bb28962c629b61b2bdd3afa5673d9417b7))
* 修复app运行 ([ace51f9](https://github.com/xxf1996/carverry/commit/ace51f9114c1d1d0514f5cee900b66f7f40d13df))
* 修复空白block拖拽交互;修复carverryChild属性没有完全传递; ([5553aee](https://github.com/xxf1996/carverry/commit/5553aee873fed1600360db63bf8268591165e5db))


### Features

* 增加package证书 ([bf9652d](https://github.com/xxf1996/carverry/commit/bf9652d2a7baa53bf805aadc8a1f1e0035a92450))



## 0.1.8 (2022-04-01)



## 0.1.7 (2022-04-01)



## 0.1.6 (2022-04-01)



## 0.1.5 (2022-04-01)


### Features

* npm配置 ([9d08a02](https://github.com/xxf1996/carverry/commit/9d08a021917b52239ccbf03fbd5161e95fa1c7c1))
* windicss支持&获取逻辑文件元数据 ([e08943a](https://github.com/xxf1996/carverry/commit/e08943a69ba4c7868f7aa33c373ec45ce2d4f599))
* 初步框架搭建 ([d6ac5c2](https://github.com/xxf1996/carverry/commit/d6ac5c2b02d44acbdae25dd2cc6732ef7a0c3724))
* 只读模式隐藏编辑交互 ([6f59e8c](https://github.com/xxf1996/carverry/commit/6f59e8c2ee1c3a667226cb5a14430079e5acb827))
* 增加hover展示&优化选中组件信息展示&增加配置文件的schema ([de555c2](https://github.com/xxf1996/carverry/commit/de555c2bc18f6a9f13aa71d8e353bc3bb8d41024))
* 增加slot skip选项 ([d943b4f](https://github.com/xxf1996/carverry/commit/d943b4f717a168b1091b4e19ce607541adb1354d))
* 增加物料schema&物料相关cli操作 ([4f48e12](https://github.com/xxf1996/carverry/commit/4f48e1298095e0a8797424009aa845313d43f176))
* 展示组件预览图&增加物料文件夹初始命令 ([c0beebb](https://github.com/xxf1996/carverry/commit/c0beebbd9499ecdeb1ada39b24c2ff783b39390a))
* 本地组件元数据获取&app转为接口请求 ([9cfe96f](https://github.com/xxf1996/carverry/commit/9cfe96f924c72b2a0cdcb91405af73cf52302984))
* 清除已完成todo&增加组件描述展示 ([610adbb](https://github.com/xxf1996/carverry/commit/610adbb265c1ad7e4b353c756f19e9352709f8c1))
* 父级窗口与iframe通过websocket进行事件传递&调试预览输出 ([515dd80](https://github.com/xxf1996/carverry/commit/515dd80d98abd84d768cf8e0c2a38f17089ecef7))
* 组件精准插入&显示位置引导条 ([da662bd](https://github.com/xxf1996/carverry/commit/da662bdebedd7e6b7177d3060952963d516bd298))
* 编译物料元数据&获取物料包信息接口 ([5aef920](https://github.com/xxf1996/carverry/commit/5aef92083e811f56b0b8056b2de9593a722e0bf3))
* 读取&显示物料库信息 ([eb12ece](https://github.com/xxf1996/carverry/commit/eb12ece6b7c56b3a177f4a133184696cdd385f62))
* 调整package结构 ([613ed05](https://github.com/xxf1996/carverry/commit/613ed050efec130fd3e131e1874d3c6d713e96d7))
* 调试分包 ([ed2180d](https://github.com/xxf1996/carverry/commit/ed2180ddb21b99a673d401bd7d6bbbc53461066e))
* 调试启动流程&预览 ([e3f7c81](https://github.com/xxf1996/carverry/commit/e3f7c816b0b948d3ff7386ca0700157f3e6f2912))
* 调试组件选项&预览输出 ([57fa172](https://github.com/xxf1996/carverry/commit/57fa1720166be01dfb616a7374d91b44137f2492))
* 调试跨域iframe交互 ([e8c6446](https://github.com/xxf1996/carverry/commit/e8c6446de499977acc65548a50697377a67ed46a))
* 调试预览输出&slot内部交换 ([349d89b](https://github.com/xxf1996/carverry/commit/349d89bc1c2fca1fb4e28f679fb50e6a95ae5031))
* 选中编辑状态&调整本地组件展示 ([011f3af](https://github.com/xxf1996/carverry/commit/011f3afdde007c59922fb80c6e5d72a57696c445))

# 魔法门英雄无敌：上古纪元 RMG 编辑器
(Heroes of Might and Magic: Olden Era RMG Editor)

这是一个用于《魔法门英雄无敌：上古纪元》随机地图生成器 (RMG) 模板文件的可视化编辑器。它允许用户通过图形界面直观地修改区域（Zones）、连接（Connections）以及全局设置，并导出符合游戏格式的 JSON 文件。

## 项目信息

*   **作者**: KuangYang
*   **发布页 / 下载**: [https://github.com/KuangYang452/HoMM-RMG-editor](https://github.com/KuangYang452/HoMM-RMG-editor)

## 主要功能

*   **可视化图表**: 使用 D3.js 渲染地图拓扑结构，支持拖拽节点调整布局。
*   **直观的连接展示**: 区分显示普通道路、野外连接、传送门及邻近连接，并直观显示守卫强度。
*   **属性编辑器**: 侧边栏支持编辑区域大小、守卫数值、资源偏好以及复杂的 JSON 结构（如必选内容引用）。
*   **多语言支持**: 内置简中汉化映射，方便查看游戏内对象的实际名称。
*   **文件操作**: 支持加载现有的 RMG `.json` 模板文件以及导出修改后的文件。

## 开发与构建

本项目基于 React, Vite 和 Electron 构建。

### 安装依赖

```bash
npm install
```

### 启动开发模式 (Web)

```bash
npm run dev
```

### 启动 Electron 开发模式

```bash
npm start
```

### 构建发布版本

```bash
npm run build
```

构建产物将位于 `release/` 目录下。

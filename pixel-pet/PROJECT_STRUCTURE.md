# 📁 项目结构

```
pixel-pet/
├── 📄 package.json              # 项目配置和依赖
├── 📄 main.js                   # Electron 主进程
├── 📄 preload.js                # 预加载脚本（IPC通信）
├── 📄 electron-builder.yml      # 打包配置
├── 📄 README.md                 # 项目说明文档
├── 📄 QUICKSTART.md             # 快速入门指南
├── 📄 PROJECT_STRUCTURE.md      # 项目结构说明
├── 📄 .gitignore                # Git忽略配置
│
├── 📁 src/                      # 源代码目录
│   ├── 📄 index.html            # 主页面
│   │
│   ├── 📁 styles/               # 样式文件
│   │   └── 📄 main.css          # 像素风格样式和动画
│   │
│   ├── 📁 scripts/              # JavaScript文件
│   │   ├── 📄 pet.js            # 宠物核心逻辑
│   │   ├── 📄 animation.js      # 动画控制器
│   │   └── 📄 interaction.js    # 交互管理器
│   │
│   └── 📁 assets/               # 资源文件
│       └── 📁 sprites/          # 精灵图素材
│
├── 📁 resources/                # 应用资源
│   ├── 📄 README.md             # 图标说明
│   ├── 🖼️ icon.png              # PNG图标
│   └── 🖼️ icon.icns             # Mac应用图标
│
├── 📁 scripts/                  # 脚本工具
│   └── 📄 generate-icon.sh      # 图标生成脚本
│
└── 📁 dist/                     # 打包输出（自动生成）
    ├── 📦 Pixel Pet-1.0.0.dmg           # Intel Mac安装包
    ├── 📦 Pixel Pet-1.0.0-arm64.dmg     # Apple Silicon安装包
    └── 📁 mac*/                           # Mac应用文件
```

## 📝 核心文件说明

### 主进程文件

| 文件 | 说明 |
|------|------|
| `main.js` | Electron主进程，创建透明窗口、系统托盘、处理IPC |
| `preload.js` | 安全的IPC通信桥接，暴露API给渲染进程 |

### 渲染进程文件

| 文件 | 说明 |
|------|------|
| `src/index.html` | 主页面，包含像素小人的DOM结构 |
| `src/styles/main.css` | 像素风格样式、动画定义、颜色配置 |
| `src/scripts/pet.js` | 宠物状态管理、自动行为、属性系统 |
| `src/scripts/animation.js` | 粒子特效、动画控制器 |
| `src/scripts/interaction.js` | 用户交互处理（拖拽、点击、右键菜单）|

### 配置文件

| 文件 | 说明 |
|------|------|
| `package.json` | 项目依赖和脚本命令 |
| `electron-builder.yml` | 打包配置（Mac DMG）|

### 资源文件

| 文件 | 说明 |
|------|------|
| `resources/icon.icns` | Mac应用图标（像素小人）|
| `scripts/generate-icon.sh` | 图标生成工具 |

## 🔧 技术架构

```
┌─────────────────────────────────────────┐
│                Electron                  │
├─────────────────────────────────────────┤
│  Main Process (main.js)                 │
│  - 创建透明无边框窗口 (200x250)          │
│  - 系统托盘管理                          │
│  - IPC通信处理                          │
├─────────────────────────────────────────┤
│  Renderer Process (src/)                │
│  - 渲染像素小人                          │
│  - 处理用户交互                          │
│  - 播放粒子特效                          │
├─────────────────────────────────────────┤
│  Preload Script (preload.js)            │
│  - 安全的API暴露                        │
│  - IPC通信桥接                          │
└─────────────────────────────────────────┘
```

## 🎨 像素小人设计

使用 16x16 像素画布，每个逻辑像素 = 8x8 实际像素：

```
行1-2:  棕色头发
行3-5:  肤色脸部 + 黑色眼睛 + 红色嘴巴
行6:    肤色下巴
行7-10: 绿色衣服 + 肤色手臂
行11-12:深色裤子
行13-14:棕色鞋子
```

## 📊 代码统计

| 类型 | 文件数 | 代码行数 |
|------|--------|---------|
| JavaScript | 4 | ~650行 |
| CSS | 1 | ~350行 |
| HTML | 1 | ~80行 |
| 配置 | 3 | ~80行 |
| 脚本 | 1 | ~120行 |
| **总计** | **10** | **~1280行** |

# CF-Path-Planner Desktop

连续碳纤维3D打印路径规划软件 — 桌面版

[![Release](https://img.shields.io/github/v/release/miracle-techlink/cf-path-planner-desktop)](https://github.com/miracle-techlink/cf-path-planner-desktop/releases/latest)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

---

## 功能

- **FEA 应力分析** — 基于 scikit-fem 的有限元分析，识别主应力方向
- **测地线路径规划** — 沿曲面最短路径铺设碳纤维
- **XY+A 多轴路径生成** — 适配四轴打印头的路径优化
- **G-code 导出** — 直接输出可用于 Snapmaker/自定义多轴打印机的 G-code
- **Three.js 3D 可视化** — 实时预览网格、应力场与纤维路径

## 截图

> 基于 Three.js 的 Snapmaker 风格界面，支持 STL 导入、FEA 求解、路径规划全流程。

## 下载

前往 [Releases](https://github.com/miracle-techlink/cf-path-planner-desktop/releases/latest) 下载最新版本：

| 平台 | 文件 |
|------|------|
| Linux x64 | `CF-Path-Planner-x.x.x.AppImage` |

## 使用方法

### Linux

```bash
chmod +x CF-Path-Planner-*.AppImage
./CF-Path-Planner-*.AppImage
```

**首次运行**：程序会自动检测并安装 Python 依赖（numpy、scipy、meshio、scikit-fem、gmsh），约需 3-5 分钟，之后启动速度正常。

### 依赖

- **Python 3.9+**（`python3` 需在 PATH 中）
- **网络连接**（首次运行自动 `pip install`）

## 本地开发

```bash
# 克隆桌面壳
git clone https://github.com/miracle-techlink/cf-path-planner-desktop.git
cd cf-path-planner-desktop

# 克隆 Python 后端（放在指定位置）
git clone https://github.com/miracle-techlink/cf-path-planner-viz-.git \
  ../连续碳纤维3D打印/cf-path-planner

# 安装 Electron 依赖
npm install

# 启动（需要本地已安装 Python 依赖）
npm start
```

## 构建 AppImage

```bash
npm run build:linux
# 输出到 release/CF-Path-Planner-*.AppImage
```

## 项目结构

```
cf-path-planner-desktop/
├── main.js          # Electron 主进程，管理 Python server 生命周期
├── preload.js       # contextBridge 安全桥接
├── splash.html      # 启动加载界面
├── package.json     # electron-builder 打包配置
└── .github/
    └── workflows/
        └── release.yml  # 推 tag 自动构建发布
```

Python 后端源码：[cf-path-planner-viz-](https://github.com/miracle-techlink/cf-path-planner-viz-)

## 技术栈

- **前端**：Three.js · HTML/CSS/JS（内嵌于 Python 后端）
- **后端**：Python · scikit-fem · gmsh · scipy · meshio
- **桌面**：Electron 36 · electron-builder
- **CI/CD**：GitHub Actions → AppImage → GitHub Releases

## License

MIT

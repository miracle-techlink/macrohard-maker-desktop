# MacroHard Maker

连续碳纤维3D打印路径规划软件 — 桌面版

[![Release](https://img.shields.io/github/v/release/miracle-techlink/macrohard-maker-desktop)](https://github.com/miracle-techlink/macrohard-maker-desktop/releases/latest)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

---

## 功能

- **XY+A combined 路径规划** — 缠绕层 + 填充层一体化，1.7M 路径点 / 3.4s
- **G-code 生成（16× 提速）** — 直接字符串格式化，22.5s → 1.35s，输出 75MB G-code
- **30 个内置模型库** — OCC 精确几何生成（空心管、T 形三通、翼梁、涡轮叶片等）
- **FEA 应力分析** — 基于 scikit-fem 的有限元分析，识别主应力方向
- **打印方向优化** — X/Y/Z 三轴旋转滑块 + 多起点自动搜索
- **支撑预览** — 悬垂角检测，柱状 / 树状双模式
- **后端日志面板** — 实时 500 条环形缓冲，可拖拽，带复制 / 清空反馈
- **Three.js 3D 可视化** — 实时路径预览，层切片滑块

## 下载

前往 [Releases](https://github.com/miracle-techlink/macrohard-maker-desktop/releases/latest) 下载最新版本：

| 平台 | 文件 |
|------|------|
| Linux x64 | `MacroHard-Maker-x.x.x.AppImage` |

## 使用方法

### Linux

```bash
chmod +x MacroHard-Maker-*.AppImage
./MacroHard-Maker-*.AppImage
```

**首次运行**：程序会自动检测并安装 Python 依赖（fastapi、uvicorn、numpy、scipy、meshio、scikit-fem、gmsh），约需 3-5 分钟，之后启动速度正常。

### 依赖

- **Python 3.9+**（`python3` 需在 PATH 中）
- **网络连接**（首次运行自动 `pip install`）

## 本地开发

```bash
# 克隆桌面壳
git clone https://github.com/miracle-techlink/macrohard-maker-desktop.git
cd macrohard-maker-desktop

# 克隆 Python 后端（放在指定位置）
git clone https://github.com/miracle-techlink/macrohard-maker-core.git \
  ../连续碳纤维3D打印/cf-path-planner

# 安装 Python 依赖
pip install fastapi "uvicorn[standard]" python-multipart numpy scipy meshio scikit-fem gmsh

# 安装 Electron 依赖
npm install

# 启动
npm start
```

### 单独启动后端（开发调试）

```bash
cd ../连续碳纤维3D打印/cf-path-planner
python webapp/run.py --port 8080
# Swagger UI: http://localhost:8080/docs
```

## 构建 AppImage

```bash
npm run build:linux
# 输出到 release/MacroHard-Maker-*.AppImage
```

## 项目结构

```
macrohard-maker-desktop/
├── main.js          # Electron 主进程，管理 Python server 生命周期
├── preload.js       # contextBridge 安全桥接
├── splash.html      # 启动加载界面
├── icons/           # 应用图标
├── package.json     # electron-builder 打包配置
└── .github/
    └── workflows/
        └── release.yml  # 推 tag 自动构建发布
```

Python 后端源码：[macrohard-maker-core](https://github.com/miracle-techlink/macrohard-maker-core)

## 技术栈

- **前端**：Three.js · HTML/CSS/JS（内嵌于 Python 后端，Luban 风格浅色主题）
- **后端**：FastAPI · uvicorn · scikit-fem · gmsh · scipy · meshio · python-occ
- **API**：`/api/v1/jobs/*` 异步任务接口 + SSE 进度流 + 旧接口兼容层
- **G-code**：直接字符串格式化（16× 加速）
- **桌面**：Electron 36 · electron-builder
- **CI/CD**：GitHub Actions → AppImage → GitHub Releases

## License

MIT

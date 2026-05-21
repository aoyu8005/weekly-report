# 项目目录结构

```
weekly-report/
├── .next/                  # 自动生成，勿手动修改
├── app/
│   ├── favicon.ico
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── node_modules/           # 自动生成，勿手动修改
├── public/
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
├── .gitignore
├── eslint.config.mjs
├── next-env.d.ts
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── PROJECT_STRUCTURE.md
└── tsconfig.json
```

---

## `app/` — App Router 根目录

Next.js 15 使用 **App Router** 约定，`app/` 目录下的每个文件都参与路由和渲染流程。

### `app/layout.tsx` — 根布局

包裹应用中所有页面的最外层组件，职责包括：

- 加载 **Geist Sans** 和 **Geist Mono** 两种 Google 字体，并将其注册为 CSS 变量（`--font-geist-sans`、`--font-geist-mono`）
- 设置全局 `<html>` 和 `<body>` 属性（语言、字体平滑、最小高度）
- 导出 `metadata` 对象，为所有页面统一设置 `<title>` 和 `<meta description>`

导航栏、页脚、全局 Provider 等需要在每个页面出现的 UI 都应放在这里。

### `app/page.tsx` — 首页

对应 `/` 路由的页面组件。目前是 Next.js 默认欢迎页，展示 Next.js Logo 和文档链接。**这是开始开发实际功能时第一个需要修改的文件。**

### `app/globals.css` — 全局样式

在 `layout.tsx` 中全局引入一次，包含：

- `@import "tailwindcss"` — 激活 Tailwind v4 的 CSS 引擎
- CSS 自定义属性（`--background`、`--foreground`）用于亮色/暗色主题切换
- `@theme inline` 块，将自定义属性映射为 Tailwind 主题 token（`--color-background`、`--font-sans` 等）
- `prefers-color-scheme: dark` 媒体查询，跟随系统自动切换配色

### `app/favicon.ico` — 网站图标

浏览器标签页显示的图标，通过 `/favicon.ico` 路径访问。

---

## `public/` — 静态资源目录

此目录下的文件直接以根路径 URL 对外提供（例如 `public/next.svg` → `/next.svg`），不经过 webpack 或 Tailwind 处理。

| 文件 | 用途 |
|---|---|
| `next.svg` | 默认首页使用的 Next.js 文字标志 |
| `vercel.svg` | 默认首页使用的 Vercel Logo |
| `file.svg` | 文件图标（脚手架占位资源） |
| `globe.svg` | 地球图标（脚手架占位资源） |
| `window.svg` | 窗口图标（脚手架占位资源） |

---

## 配置文件说明

### `package.json` — 项目清单

声明项目基本信息、npm 脚本和依赖。

**常用脚本：**

| 脚本 | 命令 | 用途 |
|---|---|---|
| `dev` | `next dev` | 启动本地开发服务器（热更新） |
| `build` | `next build` | 编译并优化生产包 |
| `start` | `next start` | 在本地运行生产包 |
| `lint` | `eslint` | 对项目执行代码风格检查 |

**运行时依赖：** `next@16.2.6`、`react@19`、`react-dom@19`

**开发依赖：** TypeScript、Tailwind CSS v4、`@tailwindcss/postcss`、ESLint（Next.js 规则集）、各 `@types/*` 类型包

### `next.config.ts` — Next.js 配置

Next.js 的主配置文件，当前为空（仅导出默认配置对象）。自定义 webpack 规则、图片域名白名单、重定向、响应头、功能开关等均在此处添加。

### `tsconfig.json` — TypeScript 配置

- 编译目标为 **ES2017**，使用 `bundler` 模块解析模式（针对 Next.js/webpack 优化）
- 开启**严格模式**，`noEmit: true` 表示 `tsc` 仅做类型检查，实际编译由 Next.js 负责
- 注册 `next` TypeScript 插件，提供更好的 IDE 支持和路由类型生成
- 配置 `@/*` 路径别名，使 `import Foo from "@/components/Foo"` 从项目根目录解析

### `postcss.config.mjs` — PostCSS 配置

配置 CSS 处理管道，注册 `@tailwindcss/postcss` 插件。这是 Tailwind v4 的集成入口——它会处理 CSS 文件中的 `@import "tailwindcss"` 并生成所有工具类。

### `eslint.config.mjs` — ESLint 配置

使用 ESLint v9 的扁平配置格式，组合了两套规则：

- `core-web-vitals` — Next.js 最佳实践 + Core Web Vitals 相关规则
- `typescript` — TypeScript 感知的代码检查规则

自动忽略构建产物目录（`.next/`、`out/`、`build/`、`next-env.d.ts`）。

### `next-env.d.ts` — Next.js 类型声明

由 Next.js **自动生成**，为 TypeScript 提供 `next/image`、`next/link` 等内置模块的类型定义。**不要手动编辑**，每次构建都会重新生成。

### `.gitignore` — Git 忽略规则

防止将构建产物和环境密钥提交到版本库，主要排除：`.next/`、`out/`、`node_modules/`、`.env*.local`。

---

## 自动生成目录（勿手动修改）

### `.next/` — 构建缓存与产物

运行 `next dev` 或 `next build` 后由 Next.js 自动生成。包含编译后的页面、路由类型、静态资源等。已被 `.gitignore` 排除，删除后重新构建即可还原。

### `node_modules/` — 第三方依赖包

运行 `npm install` 后由 npm 自动下载，包含 `package.json` 中声明的所有依赖及其子依赖。体积通常达数百 MB，已被 `.gitignore` 排除，换环境后重新执行 `npm install` 即可还原。

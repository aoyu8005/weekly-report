@AGENTS.md
##项目概述
AI 驱动型周报生成工具。可对接 GitHub，借助人工智能汇总代码提交记录，生成可对外分享的周报页面。
##技术栈
- Next.js 15 (App Router) + TypeScript
- Tailwind CSS for styling
- NextAuth.js for GitHub OAuth
- 调用 Claude API (via Anthropic SDK) 或 其他大模型生成简报
##代码规范
- 默认优先使用服务端组件，仅必要场景才添加 use client
- API routes 统一放置在 app/api/ 目录，采用 Route Handlers
- Prefer named exports
- Error handling: always use try-catch in API routes
##测试规范
- 提交代码前执行 npm run lint 校验代码格式
- 开发UI页面前，先用 curl 命令调试接口功能
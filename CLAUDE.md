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
##Git 规范
###分支命名
- 功能开发：`feat/简短描述`，如 `feat/github-oauth`
- 问题修复：`fix/简短描述`，如 `fix/token-refresh`
- 文档更新：`docs/简短描述`
###Commit 消息格式
使用 Conventional Commits 规范：`<类型>: <简短描述>`
- `feat:` 新功能
- `fix:` 问题修复
- `refactor:` 重构（不影响功能）
- `style:` 样式/格式调整
- `docs:` 文档变更
- `chore:` 构建/依赖/配置变更
示例：`feat: 添加 GitHub OAuth 登录` / `fix: 修复 token 过期未刷新`
###提交规则
- 每次提交只做一件事，保持原子性
- 禁止直接推送到 main 分支，通过 PR 合并
- PR 合并前须通过 lint 检查
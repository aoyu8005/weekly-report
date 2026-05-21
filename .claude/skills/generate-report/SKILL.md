---
name: generate-report
description: 生成周报并保存 Markdown 到本地 reports/ 目录。/generate-report -1 无AI模式（默认）；/generate-report -2 选择AI模型
---

# generate-report

自动启动 weekly-report 项目、打开浏览器完成生成，并将周报保存为 Markdown 文件。

## 执行步骤

### Step 1：解析参数

读取 ARGUMENTS：
- 空 / `-1` → mode=1（无 AI）
- `-2` → mode=2（选择 AI 模型）

### Step 2（仅 mode=2）：展示可选模型

在终端输出以下列表，提示用户输入编号后继续：

```
请选择 AI 模型（输入编号）：

  Claude（需 ANTHROPIC_API_KEY）
    [1]  Opus 4.7        claude-opus-4-7
    [2]  Sonnet 4.6      claude-sonnet-4-6
    [3]  Haiku 4.5       claude-haiku-4-5-20251001

  OpenAI（需 OPENAI_API_KEY）
    [4]  GPT-4o          gpt-4o
    [5]  GPT-4o Mini     gpt-4o-mini
    [6]  o3-mini         o3-mini

  智谱 GLM（需 GLM_API_KEY）
    [7]  GLM-4 Flash     glm-4-flash      （免费）
    [8]  GLM-4 Air       glm-4-air
    [9]  GLM-4 Plus      glm-4-plus
    [10] Z1 Flash        glm-z1-flash     （推理·免费）

  Google Gemini（需 GEMINI_API_KEY）
    [11] 2.0 Flash       gemini-2.0-flash
    [12] 2.0 Flash Lite  gemini-2.0-flash-lite
    [13] 1.5 Pro         gemini-1.5-pro
    [14] 1.5 Flash       gemini-1.5-flash
```

根据编号映射出 provider（claude/openai/glm/gemini）和 model ID。

### Step 3：检查并启动 dev server

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
```

若返回非 `200`，在项目目录后台启动开发服务器：

```bash
cd /Users/aoyu/Documents/Claude/first-cc/weekly-report && npm run dev > /tmp/weekly-report-dev.log 2>&1 &
```

每 2 秒轮询一次，最多等待 30 秒，直到 `http://localhost:3000` 返回 200。

### Step 4：构建 URL 并打开浏览器

**mode=1（无 AI）：**
```
http://localhost:3000/dashboard?autoRepo=weekly-report&autoProvider=null&autogenerate=1
```

**mode=2（有 AI）：**
```
http://localhost:3000/dashboard?autoRepo=weekly-report&autoProvider=<provider>&autoModel=<model>&autogenerate=1
```

执行 `open <URL>` 打开浏览器。

告知用户：
- 若已登录 GitHub：浏览器将自动选中 weekly-report 仓库并开始生成
- 若未登录：请先完成 GitHub OAuth 授权，授权后页面会自动继续

### Step 5：确认文件已保存

等待约 60 秒（AI 模式生成时间较长），然后检查本地文件：

```bash
ls /Users/aoyu/Documents/Claude/first-cc/weekly-report/reports/weekly-report-$(date +%Y-%m-%d).md 2>/dev/null && echo "FOUND" || echo "NOT_FOUND"
```

- 若 `FOUND`：告知用户文件路径 `reports/weekly-report-<日期>.md`，任务完成
- 若 `NOT_FOUND`：提示用户在浏览器中手动点击"下载 .md 文件"按钮，或检查浏览器是否完成了生成

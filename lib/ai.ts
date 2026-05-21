export type AIProvider = "claude" | "openai" | "glm" | "gemini" | null;

export interface CommitItem {
  repo: string;
  date: string;
  message: string;
  sha: string;
}

export interface ReportInput {
  repos: string[];
  commits: CommitItem[];
  weekRange: { start: string; end: string };
}

function buildPrompt(input: ReportInput): string {
  const commitText = input.commits
    .map((c) => `[${c.repo}] ${c.date}: ${c.message}`)
    .join("\n");

  return `你是一个工程师助手，请根据以下 Git 提交记录生成一份中文技术周报。

要求：
1. 直接输出 Markdown 内容，不要用代码块（如 \`\`\`markdown）包裹
2. 包含"## 本周工作总结"章节（2-4段自然语言，按工作主题归纳）
3. 包含"## 提交明细"章节（表格：日期 | 仓库 | 提交信息 | Hash）
4. 语言简洁专业，适合在团队内分享

时间范围：${input.weekRange.start} ~ ${input.weekRange.end}
仓库：${input.repos.join(", ")}
提交总数：${input.commits.length}

提交记录：
${commitText}`;
}

async function streamWithClaude(prompt: string, model: string): Promise<ReadableStream<Uint8Array>> {
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const stream = client.messages.stream({
    model,
    max_tokens: 2048,
    messages: [{ role: "user", content: prompt }],
  });

  const encoder = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (
          chunk.type === "content_block_delta" &&
          chunk.delta.type === "text_delta"
        ) {
          controller.enqueue(encoder.encode(chunk.delta.text));
        }
      }
      controller.close();
    },
    cancel() {
      stream.abort();
    },
  });
}

async function streamWithOpenAI(prompt: string, model: string): Promise<ReadableStream<Uint8Array>> {
  const OpenAI = (await import("openai")).default;
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const stream = await client.chat.completions.create({
    model,
    messages: [{ role: "user", content: prompt }],
    stream: true,
  });

  const encoder = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content ?? "";
        if (text) controller.enqueue(encoder.encode(text));
      }
      controller.close();
    },
  });
}

async function streamWithGLM(prompt: string, model: string): Promise<ReadableStream<Uint8Array>> {
  const OpenAI = (await import("openai")).default;
  const client = new OpenAI({
    apiKey: process.env.GLM_API_KEY,
    baseURL: "https://open.bigmodel.cn/api/paas/v4/",
  });

  const stream = await client.chat.completions.create({
    model,
    messages: [{ role: "user", content: prompt }],
    stream: true,
  });

  const encoder = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content ?? "";
        if (text) controller.enqueue(encoder.encode(text));
      }
      controller.close();
    },
  });
}

async function streamWithGemini(prompt: string, model: string): Promise<ReadableStream<Uint8Array>> {
  const { GoogleGenerativeAI } = await import("@google/generative-ai");
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const genModel = genAI.getGenerativeModel({ model });

  const result = await genModel.generateContentStream(prompt);
  const encoder = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      for await (const chunk of result.stream) {
        const text = chunk.text();
        if (text) controller.enqueue(encoder.encode(text));
      }
      controller.close();
    },
  });
}

const DEFAULT_MODELS: Record<NonNullable<AIProvider>, string> = {
  claude: "claude-sonnet-4-6",
  openai: "gpt-4o-mini",
  glm: "glm-4-air",
  gemini: "gemini-2.0-flash",
};

export async function generateReport(
  provider: AIProvider,
  input: ReportInput,
  model?: string
): Promise<ReadableStream<Uint8Array> | null> {
  if (!provider) return null;

  const prompt = buildPrompt(input);
  const resolvedModel = model || DEFAULT_MODELS[provider];

  if (provider === "claude") return streamWithClaude(prompt, resolvedModel);
  if (provider === "glm")    return streamWithGLM(prompt, resolvedModel);
  if (provider === "gemini") return streamWithGemini(prompt, resolvedModel);
  return streamWithOpenAI(prompt, resolvedModel);
}

import { auth } from "@/lib/auth";
import { generateReport, type AIProvider, type CommitItem } from "@/lib/ai";

function formatCommitsAsMarkdown(
  commits: CommitItem[],
  weekRange: { start: string; end: string },
  repos: string[]
): string {
  const repoNames = repos.map((r) => r.split("/").pop() ?? r).join("、");
  const rows = commits
    .map((c) => `| ${c.date} | ${c.repo.split("/").pop()} | ${c.message} | \`${c.sha}\` |`)
    .join("\n");

  return `# 周报 ${weekRange.start} ~ ${weekRange.end}

**仓库：** ${repoNames}
**提交数：** ${commits.length}

---

## 提交明细

| 日期 | 仓库 | 提交信息 | Hash |
|------|------|----------|------|
${rows}
`;
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.accessToken) {
      return Response.json({ error: "未登录" }, { status: 401 });
    }

    const body = await request.json();
    const { provider, commits, repos, weekRange } = body as {
      provider: AIProvider;
      commits: CommitItem[];
      repos: string[];
      weekRange: { start: string; end: string };
    };

    if (!provider) {
      const markdown = formatCommitsAsMarkdown(commits, weekRange, repos);
      return Response.json({ markdown });
    }

    if (provider === "claude" && !process.env.ANTHROPIC_API_KEY) {
      return Response.json({ error: "ANTHROPIC_API_KEY 未配置" }, { status: 400 });
    }
    if (provider === "openai" && !process.env.OPENAI_API_KEY) {
      return Response.json({ error: "OPENAI_API_KEY 未配置" }, { status: 400 });
    }

    const stream = await generateReport(provider, { repos, commits, weekRange });

    if (!stream) {
      const markdown = formatCommitsAsMarkdown(commits, weekRange, repos);
      return Response.json({ markdown });
    }

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "未知错误";
    return Response.json({ error: msg }, { status: 500 });
  }
}

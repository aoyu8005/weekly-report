import { mkdir, writeFile } from "fs/promises";
import path from "path";

export async function POST(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return Response.json({ error: "仅在开发环境可用" }, { status: 403 });
  }

  try {
    const { markdown } = (await request.json()) as { markdown: string };
    if (!markdown) {
      return Response.json({ error: "markdown 内容为空" }, { status: 400 });
    }

    const date = new Date().toISOString().slice(0, 10);
    const filename = `weekly-report-${date}.md`;
    const dir = path.join(process.cwd(), "reports");

    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, filename), markdown, "utf-8");

    return Response.json({ saved: `reports/${filename}` });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "保存失败";
    return Response.json({ error: msg }, { status: 500 });
  }
}

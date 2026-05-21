"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { useRouter } from "next/navigation";
import type { AIProvider } from "@/lib/ai";

export default function ReportPage() {
  const [markdown, setMarkdown] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function generate() {
      const commits = JSON.parse(sessionStorage.getItem("commits") ?? "[]");
      const providerRaw = sessionStorage.getItem("provider");
      const since = sessionStorage.getItem("since") ?? "";
      const until = sessionStorage.getItem("until") ?? "";
      const repos = JSON.parse(sessionStorage.getItem("repos") ?? "[]");

      if (!since || repos.length === 0) {
        setError("未找到周报数据，请返回重新生成。");
        setLoading(false);
        return;
      }

      const provider: AIProvider =
        providerRaw === "null" || !providerRaw ? null : (providerRaw as AIProvider);

      const weekRange = {
        start: since.slice(0, 10),
        end: until.slice(0, 10),
      };

      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, commits, repos, weekRange }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error ?? "生成失败");
        setLoading(false);
        return;
      }

      const contentType = response.headers.get("Content-Type") ?? "";

      if (contentType.includes("application/json")) {
        const data = await response.json();
        setMarkdown(data.markdown);
        setLoading(false);
        return;
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setMarkdown(accumulated);
      }

      setLoading(false);
    }

    generate().catch((e) => {
      setError(e instanceof Error ? e.message : "未知错误");
      setLoading(false);
    });
  }, []);

  function handleDownload() {
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `weekly-report-${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col flex-1 bg-zinc-50 dark:bg-zinc-950 font-sans">
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/dashboard")}
              className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
            >
              ← 返回
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xl">📋</span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">本周周报</span>
            </div>
          </div>
          <button
            onClick={handleDownload}
            disabled={loading || !markdown}
            className="flex items-center gap-2 h-9 px-4 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            下载 .md 文件
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-10">
        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30 p-6 text-sm text-red-600 dark:text-red-400 space-y-3">
            <p>{error}</p>
            <button
              onClick={() => router.push("/dashboard")}
              className="text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              返回重试
            </button>
          </div>
        ) : (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-8">
            {loading && !markdown && (
              <div className="flex items-center gap-3 text-zinc-500 dark:text-zinc-400 text-sm py-8 justify-center">
                <span className="animate-spin text-lg">⏳</span>
                <span>正在生成周报，请稍候…</span>
              </div>
            )}

            {markdown && (
              <div className="prose prose-zinc dark:prose-invert max-w-none prose-headings:font-semibold prose-table:text-sm">
                <ReactMarkdown>{markdown}</ReactMarkdown>
              </div>
            )}

            {loading && markdown && (
              <div className="flex items-center gap-2 text-xs text-zinc-400 mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <span className="animate-pulse">●</span>
                <span>AI 正在生成中…</span>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

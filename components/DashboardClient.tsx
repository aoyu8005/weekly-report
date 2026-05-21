"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { GitHubRepo } from "@/lib/github";
import type { AIProvider } from "@/lib/ai";

interface Props {
  repos: GitHubRepo[];
  userLogin: string;
}

export function DashboardClient({ repos, userLogin }: Props) {
  const [selectedRepos, setSelectedRepos] = useState<string[]>([]);
  const [provider, setProvider] = useState<AIProvider>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function toggleRepo(fullName: string) {
    setSelectedRepos((prev) =>
      prev.includes(fullName)
        ? prev.filter((r) => r !== fullName)
        : [...prev, fullName]
    );
  }

  async function handleGenerate() {
    if (selectedRepos.length === 0) {
      setError("请至少选择一个仓库");
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/commits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoFullNames: selectedRepos }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "获取提交记录失败");
      }

      const { commits, since, until } = await res.json();

      sessionStorage.setItem("commits", JSON.stringify(commits));
      sessionStorage.setItem("provider", provider ?? "null");
      sessionStorage.setItem("since", since);
      sessionStorage.setItem("until", until);
      sessionStorage.setItem("repos", JSON.stringify(selectedRepos));

      router.push("/report");
    } catch (e) {
      setError(e instanceof Error ? e.message : "未知错误");
      setLoading(false);
    }
  }

  const aiOptions: { value: AIProvider; label: string; desc: string }[] = [
    { value: "claude", label: "Claude", desc: "Anthropic Claude（推荐）" },
    { value: "openai", label: "OpenAI", desc: "GPT-4o Mini" },
    { value: null, label: "无 AI", desc: "仅导出提交记录，自行总结" },
  ];

  return (
    <div className="space-y-8">
      {/* 仓库选择 */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            选择仓库
          </h2>
          <span className="text-sm text-zinc-500">
            已选 {selectedRepos.length} / {repos.length}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-80 overflow-y-auto pr-1">
          {repos.map((repo) => {
            const checked = selectedRepos.includes(repo.full_name);
            return (
              <label
                key={repo.id}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  checked
                    ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30"
                    : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleRepo(repo.full_name)}
                  className="mt-0.5 accent-indigo-600"
                />
                <div className="min-w-0">
                  <div className="font-medium text-sm text-zinc-900 dark:text-zinc-100 truncate">
                    {repo.name}
                  </div>
                  {repo.description && (
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                      {repo.description}
                    </div>
                  )}
                  {repo.private && (
                    <span className="inline-block text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded mt-1">
                      私有
                    </span>
                  )}
                </div>
              </label>
            );
          })}
        </div>
      </section>

      {/* AI 提供方选择 */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          AI 总结方式
        </h2>
        <div className="flex flex-col sm:flex-row gap-2">
          {aiOptions.map((opt) => {
            const active = provider === opt.value;
            return (
              <button
                key={String(opt.value)}
                onClick={() => setProvider(opt.value)}
                className={`flex-1 text-left p-4 rounded-xl border transition-colors ${
                  active
                    ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30"
                    : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600"
                }`}
              >
                <div className="font-medium text-sm text-zinc-900 dark:text-zinc-100">
                  {opt.label}
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  {opt.desc}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <button
        onClick={handleGenerate}
        disabled={loading || selectedRepos.length === 0}
        className="w-full h-12 rounded-xl bg-indigo-600 text-white font-medium text-sm hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "正在获取提交记录…" : "生成本周周报"}
      </button>

      <p className="text-xs text-zinc-400 text-center">
        将获取 {userLogin} 在所选仓库最近 7 天的提交记录
      </p>
    </div>
  );
}

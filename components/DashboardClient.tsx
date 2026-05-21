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
      prev.includes(fullName) ? prev.filter((r) => r !== fullName) : [...prev, fullName]
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

  const aiOptions: { value: AIProvider; label: string; desc: string; tag?: string }[] = [
    { value: "claude", label: "Claude", desc: "Anthropic", tag: "推荐" },
    { value: "openai", label: "OpenAI", desc: "GPT-4o Mini" },
    { value: null, label: "无 AI", desc: "仅导出原始记录" },
  ];

  const canGenerate = !loading && selectedRepos.length > 0;

  return (
    <div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .repo-row:hover { background: rgba(255,255,255,0.02) !important; }
        .repo-row-active:hover { background: rgba(245,158,11,0.07) !important; }
        .ai-btn:hover { border-color: #27272a !important; }
        .ai-btn-active:hover { border-color: #f59e0b !important; }
        .gen-btn:not(:disabled):hover { background: #fbbf24 !important; }
        .sign-out-btn:hover { color: #f59e0b !important; }
      `}</style>

      {/* ── 选择仓库 ── */}
      <section style={{ marginBottom: "36px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
          <span style={{ fontFamily: "var(--font-geist-mono)", fontSize: "10px", letterSpacing: "0.18em", textTransform: "uppercase", color: "#a1a1aa" }}>
            选择仓库
          </span>
          <span style={{ fontFamily: "var(--font-geist-mono)", fontSize: "10px", color: selectedRepos.length > 0 ? "#f59e0b" : "#71717a", transition: "color 0.2s" }}>
            {selectedRepos.length}&nbsp;/&nbsp;{repos.length}
          </span>
        </div>

        <div style={{ border: "1px solid #16161f", borderRadius: "8px", overflow: "hidden", maxHeight: "288px", overflowY: "auto" }}>
          {repos.map((repo, i) => {
            const checked = selectedRepos.includes(repo.full_name);
            return (
              <label
                key={repo.id}
                className={checked ? "repo-row-active" : "repo-row"}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "11px 14px",
                  cursor: "pointer",
                  background: checked ? "rgba(245,158,11,0.05)" : "transparent",
                  borderBottom: i < repos.length - 1 ? "1px solid #16161f" : "none",
                  borderLeft: `2px solid ${checked ? "#f59e0b" : "transparent"}`,
                  transition: "all 0.15s",
                }}
              >
                <input type="checkbox" checked={checked} onChange={() => toggleRepo(repo.full_name)} style={{ display: "none" }} />
                <span
                  style={{
                    width: "14px", height: "14px", borderRadius: "3px", flexShrink: 0,
                    border: checked ? "1.5px solid #f59e0b" : "1.5px solid #27272a",
                    background: checked ? "#f59e0b" : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.15s",
                  }}
                >
                  {checked && (
                    <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                      <path d="M1 3L3 5L7 1" stroke="#08080d" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "var(--font-geist-mono)", fontSize: "12px", color: checked ? "#f4f4f5" : "#a1a1aa", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", transition: "color 0.15s" }}>
                    {repo.name}
                  </div>
                  {repo.description && (
                    <div style={{ fontFamily: "var(--font-geist-mono)", fontSize: "10px", color: "#71717a", marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {repo.description}
                    </div>
                  )}
                </div>

                {repo.private && (
                  <span style={{ fontFamily: "var(--font-geist-mono)", fontSize: "9px", color: "#a1a1aa", border: "1px solid #3f3f46", borderRadius: "3px", padding: "1px 5px", letterSpacing: "0.05em", textTransform: "uppercase", flexShrink: 0 }}>
                    私有
                  </span>
                )}
              </label>
            );
          })}
        </div>
      </section>

      {/* 分隔 */}
      <div style={{ borderTop: "1px solid #16161f", marginBottom: "36px" }} />

      {/* ── AI 总结方式 ── */}
      <section style={{ marginBottom: "36px" }}>
        <span style={{ display: "block", fontFamily: "var(--font-geist-mono)", fontSize: "10px", letterSpacing: "0.18em", textTransform: "uppercase", color: "#a1a1aa", marginBottom: "10px" }}>
          AI 总结方式
        </span>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
          {aiOptions.map((opt) => {
            const active = provider === opt.value;
            return (
              <button
                key={String(opt.value)}
                onClick={() => setProvider(opt.value)}
                className={active ? "ai-btn-active" : "ai-btn"}
                style={{
                  padding: "14px 12px", borderRadius: "6px", cursor: "pointer", textAlign: "left",
                  border: active ? "1px solid #f59e0b" : "1px solid #16161f",
                  background: active ? "rgba(245,158,11,0.07)" : "transparent",
                  transition: "all 0.15s", position: "relative",
                }}
              >
                {opt.tag && (
                  <span style={{ position: "absolute", top: "6px", right: "7px", fontFamily: "var(--font-geist-mono)", fontSize: "8px", color: "#f59e0b", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                    {opt.tag}
                  </span>
                )}
                <div style={{ fontFamily: "var(--font-syne)", fontSize: "15px", fontWeight: 700, color: active ? "#f59e0b" : "#71717a", marginBottom: "4px", transition: "color 0.15s" }}>
                  {opt.label}
                </div>
                <div style={{ fontFamily: "var(--font-geist-mono)", fontSize: "10px", color: active ? "#d97706" : "#71717a", transition: "color 0.15s" }}>
                  {opt.desc}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 错误 */}
      {error && (
        <div style={{ marginBottom: "12px", fontFamily: "var(--font-geist-mono)", fontSize: "11px", color: "#f87171" }}>
          ✗ {error}
        </div>
      )}

      {/* ── 生成按钮 ── */}
      <button
        onClick={handleGenerate}
        disabled={!canGenerate}
        className="gen-btn"
        style={{
          width: "100%", padding: "14px", borderRadius: "6px", border: "none",
          background: canGenerate ? "#f59e0b" : "#16161f",
          color: canGenerate ? "#08080d" : "#3f3f46",
          fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: "13px", letterSpacing: "0.06em",
          cursor: canGenerate ? "pointer" : "not-allowed",
          transition: "all 0.2s",
          display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
        }}
      >
        {loading ? (
          <>
            <span style={{ display: "inline-block", width: "12px", height: "12px", border: "1.5px solid #3f3f46", borderTopColor: "#f59e0b", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            正在获取提交记录
          </>
        ) : (
          <>
            生成本周周报
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </>
        )}
      </button>

      <p style={{ marginTop: "20px", fontFamily: "var(--font-geist-mono)", fontSize: "10px", color: "#27272a", textAlign: "center", letterSpacing: "0.04em" }}>
        获取 {userLogin} 在所选仓库最近 7 天的提交记录
      </p>
    </div>
  );
}

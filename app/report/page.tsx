"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useRouter } from "next/navigation";
import type { AIProvider } from "@/lib/ai";

type Phase = "loading" | "streaming" | "done" | "error";

export default function ReportPage() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [markdown, setMarkdown] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // 直接操作 pre DOM，绕过 React state，消除流式输出闪烁
  const preRef = useRef<HTMLPreElement>(null);
  const bufferRef = useRef("");

  useEffect(() => {
    async function generate() {
      const commits = JSON.parse(sessionStorage.getItem("commits") ?? "[]");
      const providerRaw = sessionStorage.getItem("provider");
      const modelRaw = sessionStorage.getItem("model");
      const since = sessionStorage.getItem("since") ?? "";
      const until = sessionStorage.getItem("until") ?? "";
      const repos = JSON.parse(sessionStorage.getItem("repos") ?? "[]");

      if (!since || repos.length === 0) {
        setError("未找到周报数据，请返回重新生成。");
        setPhase("error");
        return;
      }

      const provider: AIProvider =
        providerRaw === "null" || !providerRaw ? null : (providerRaw as AIProvider);
      const model = modelRaw === "null" || !modelRaw ? undefined : modelRaw;

      const weekRange = { start: since.slice(0, 10), end: until.slice(0, 10) };

      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, model, commits, repos, weekRange }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error ?? "生成失败");
        setPhase("error");
        return;
      }

      const contentType = response.headers.get("Content-Type") ?? "";

      if (contentType.includes("application/json")) {
        const data = await response.json();
        setMarkdown(data.markdown);
        setPhase("done");
        return;
      }

      // 流式输出：先切换到 streaming 阶段（渲染 pre 元素），再逐 chunk 直接写 DOM
      setPhase("streaming");

      // 等下一个微任务确保 pre 已挂载
      await Promise.resolve();

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      bufferRef.current = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        bufferRef.current += decoder.decode(value, { stream: true });
        // 直接写 textContent，完全不经过 React，无 diff、无重排
        if (preRef.current) {
          preRef.current.textContent = bufferRef.current;
        }
      }

      // 流结束：触发一次 React 渲染，切换到格式化视图
      setMarkdown(bufferRef.current);
      setPhase("done");
    }

    generate().catch((e) => {
      setError(e instanceof Error ? e.message : "未知错误");
      setPhase("error");
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

  const canDownload = phase === "done" && !!markdown;

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "#08080d", fontFamily: "var(--font-geist-sans)" }}>
      <style>{`
        .report-back:hover { color: #f59e0b !important; }
        .report-dl:not(:disabled):hover { background: #fbbf24 !important; }
        .md-body h1, .md-body h2, .md-body h3 {
          font-family: var(--font-syne);
          color: #f4f4f5;
          font-weight: 700;
          margin-top: 1.8em;
          margin-bottom: 0.5em;
          line-height: 1.2;
        }
        .md-body h1:first-child, .md-body h2:first-child { margin-top: 0; }
        .md-body h1 { font-size: 22px; }
        .md-body h2 { font-size: 16px; border-bottom: 1px solid #16161f; padding-bottom: 8px; }
        .md-body h3 { font-size: 13px; color: #a1a1aa; }
        .md-body p { color: #a1a1aa; font-size: 13px; line-height: 1.85; margin-bottom: 1em; }
        .md-body strong { color: #e4e4e7; font-weight: 600; }
        .md-body ul, .md-body ol { color: #a1a1aa; font-size: 13px; line-height: 1.85; padding-left: 1.4em; margin-bottom: 1em; }
        .md-body li { margin-bottom: 4px; }
        .md-body code { font-family: var(--font-geist-mono); font-size: 11px; background: #16161f; color: #f59e0b; border-radius: 3px; padding: 1px 6px; }
        .md-body pre { background: #0e0e16; border: 1px solid #1e1e2e; border-radius: 6px; padding: 16px; overflow-x: auto; margin-bottom: 1em; }
        .md-body pre code { background: none; padding: 0; color: #a1a1aa; font-size: 12px; }
        .md-body hr { border: none; border-top: 1px solid #16161f; margin: 2em 0; }
        .md-body table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 1.5em; }
        .md-body thead tr { border-bottom: 1px solid #27272a; }
        .md-body th { font-family: var(--font-geist-mono); font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #52525b; font-weight: 500; padding: 8px 14px; text-align: left; white-space: nowrap; }
        .md-body td { padding: 10px 14px; color: #a1a1aa; border-bottom: 1px solid #16161f; vertical-align: top; font-family: var(--font-geist-mono); font-size: 12px; word-break: break-word; }
        .md-body tr:last-child td { border-bottom: none; }
        .md-body tbody tr:hover td { background: rgba(255,255,255,0.018); }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* 背景点阵 */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", backgroundImage: "radial-gradient(circle, rgba(245,158,11,0.05) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />

      {/* Header */}
      <header style={{ position: "relative", zIndex: 10, borderBottom: "1px solid #16161f", background: "rgba(8,8,13,0.9)", backdropFilter: "blur(12px)" }}>
        <div style={{ maxWidth: "820px", margin: "0 auto", padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <button
              onClick={() => router.push("/dashboard")}
              className="report-back"
              style={{ fontFamily: "var(--font-geist-mono)", fontSize: "11px", color: "#52525b", background: "none", border: "none", cursor: "pointer", transition: "color 0.15s" }}
            >
              ← 返回
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#f59e0b", boxShadow: "0 0 6px #f59e0b88", display: "inline-block", flexShrink: 0 }} />
              <span style={{ fontFamily: "var(--font-syne)", fontSize: "13px", fontWeight: 700, color: "#e4e4e7", letterSpacing: "0.08em" }}>
                本周周报
              </span>
            </div>
          </div>

          <button
            onClick={handleDownload}
            disabled={!canDownload}
            className="report-dl"
            style={{
              display: "flex", alignItems: "center", gap: "6px",
              padding: "7px 16px", borderRadius: "6px", border: "none",
              background: canDownload ? "#f59e0b" : "#16161f",
              color: canDownload ? "#08080d" : "#3f3f46",
              fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: "12px", letterSpacing: "0.05em",
              cursor: canDownload ? "pointer" : "not-allowed", transition: "all 0.2s",
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 1v7M3 6l3 3 3-3M1 10h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            下载 .md 文件
          </button>
        </div>
      </header>

      {/* Main */}
      <main style={{ position: "relative", zIndex: 10, flex: 1, maxWidth: "820px", margin: "0 auto", width: "100%", padding: "48px 24px" }}>
        {phase === "error" ? (
          <div style={{ border: "1px solid rgba(239,68,68,0.25)", background: "rgba(239,68,68,0.04)", borderRadius: "8px", padding: "20px 24px" }}>
            <p style={{ fontFamily: "var(--font-geist-mono)", fontSize: "12px", color: "#f87171", marginBottom: "12px" }}>✗ {error}</p>
            <button
              onClick={() => router.push("/dashboard")}
              style={{ fontFamily: "var(--font-geist-mono)", fontSize: "11px", color: "#f59e0b", background: "none", border: "none", cursor: "pointer" }}
            >
              ← 返回重试
            </button>
          </div>
        ) : (
          <div style={{ border: "1px solid #16161f", borderRadius: "10px", background: "#0b0b12", overflow: "hidden" }}>
            <div style={{ height: "2px", background: "linear-gradient(90deg, #f59e0b 0%, transparent 60%)" }} />

            <div style={{ padding: "36px 40px" }}>
              {/* 等待第一个 chunk */}
              {phase === "loading" && (
                <div style={{ display: "flex", alignItems: "center", gap: "12px", justifyContent: "center", padding: "60px 0" }}>
                  <span style={{ display: "inline-block", width: "14px", height: "14px", border: "1.5px solid #27272a", borderTopColor: "#f59e0b", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                  <span style={{ fontFamily: "var(--font-geist-mono)", fontSize: "12px", color: "#52525b" }}>
                    正在生成周报，请稍候…
                  </span>
                </div>
              )}

              {/* 流式输出中：pre 由 ref 直接驱动，零 React 重渲染 */}
              {phase === "streaming" && (
                <>
                  <pre
                    ref={preRef}
                    style={{
                      fontFamily: "var(--font-geist-mono)", fontSize: "12px", color: "#a1a1aa",
                      lineHeight: 1.85, whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0,
                    }}
                  />
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "24px", paddingTop: "20px", borderTop: "1px solid #16161f" }}>
                    <span style={{ fontFamily: "var(--font-geist-mono)", fontSize: "10px", color: "#f59e0b", animation: "blink 1.2s ease infinite" }}>●</span>
                    <span style={{ fontFamily: "var(--font-geist-mono)", fontSize: "10px", color: "#3f3f46" }}>AI 正在生成中…</span>
                  </div>
                </>
              )}

              {/* 完成：一次性渲染格式化 Markdown */}
              {phase === "done" && markdown && (
                <div className="md-body">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

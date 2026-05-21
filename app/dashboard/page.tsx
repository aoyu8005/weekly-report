import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getUserRepos } from "@/lib/github";
import { DashboardClient } from "@/components/DashboardClient";

interface SearchParams {
  autoRepo?: string;
  autoProvider?: string;
  autoModel?: string;
  autogenerate?: string;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await auth();
  if (!session?.accessToken) redirect("/");

  const autoConfig = await searchParams;

  let repos = [];
  let fetchError = "";

  try {
    repos = await getUserRepos(session.accessToken);
  } catch (e) {
    fetchError = e instanceof Error ? e.message : "获取仓库列表失败";
  }

  const userLogin = (session.user?.name ?? session.user?.email ?? "用户") as string;

  return (
    <div
      className="flex flex-col min-h-full"
      style={{ background: "#08080d", fontFamily: "var(--font-geist-sans)" }}
    >
      <style>{`.sign-out-btn:hover { color: #f59e0b !important; }`}</style>
      {/* 背景点阵 */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(245,158,11,0.06) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
      {/* 底部渐变遮罩 */}
      <div
        className="fixed bottom-0 left-0 right-0 h-64 pointer-events-none"
        style={{
          background: "linear-gradient(to top, #08080d, transparent)",
        }}
      />

      {/* Header */}
      <header
        className="relative z-10 border-b"
        style={{ borderColor: "#16161f", background: "rgba(8,8,13,0.9)", backdropFilter: "blur(12px)" }}
      >
        <div className="max-w-3xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: "#f59e0b", boxShadow: "0 0 6px #f59e0b88" }}
            />
            <span
              style={{
                fontFamily: "var(--font-syne)",
                color: "#e4e4e7",
                fontWeight: 700,
                fontSize: "13px",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              周报
            </span>
            <span style={{ color: "#27272a", fontFamily: "var(--font-geist-mono)", fontSize: "12px" }}>
              /
            </span>
            <span style={{ color: "#71717a", fontFamily: "var(--font-geist-mono)", fontSize: "11px" }}>
              generator
            </span>
          </div>

          <div className="flex items-center gap-3">
            {session.user?.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={session.user.image}
                alt={userLogin}
                className="w-5 h-5 rounded-full"
                style={{ border: "1px solid #3f3f46" }}
              />
            )}
            <span style={{ color: "#a1a1aa", fontFamily: "var(--font-geist-mono)", fontSize: "11px" }}>
              {userLogin}
            </span>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <button
                type="submit"
                className="sign-out-btn"
                style={{ color: "#3f3f46", fontFamily: "var(--font-geist-mono)", fontSize: "11px", transition: "color 0.15s" }}
              >
                退出
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="relative z-10 flex-1 max-w-3xl mx-auto w-full px-6 py-16">
        <div className="mb-12">
          <p
            style={{
              color: "#f59e0b",
              fontFamily: "var(--font-geist-mono)",
              fontSize: "11px",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              marginBottom: "16px",
            }}
          >
            ── 本周报告生成
          </p>
          <h1
            style={{
              fontFamily: "var(--font-syne)",
              color: "#f4f4f5",
              fontWeight: 800,
              fontSize: "clamp(28px, 5vw, 42px)",
              lineHeight: 1.1,
              marginBottom: "12px",
            }}
          >
            生成本周周报
          </h1>
          <p style={{ color: "#71717a", fontFamily: "var(--font-geist-mono)", fontSize: "12px", lineHeight: 1.8 }}>
            选择仓库并配置 AI 方式，自动汇总最近 7 天的提交记录
          </p>
        </div>

        {fetchError ? (
          <div
            className="rounded-lg p-4 text-sm"
            style={{
              border: "1px solid rgba(239,68,68,0.25)",
              background: "rgba(239,68,68,0.04)",
              color: "#f87171",
              fontFamily: "var(--font-geist-mono)",
              fontSize: "12px",
            }}
          >
            ✗ {fetchError}
          </div>
        ) : repos.length === 0 ? (
          <div
            className="rounded-lg p-12 text-center"
            style={{
              border: "1px solid #16161f",
              color: "#3f3f46",
              fontFamily: "var(--font-geist-mono)",
              fontSize: "12px",
            }}
          >
            未找到任何仓库
          </div>
        ) : (
          <DashboardClient repos={repos} userLogin={userLogin} autoConfig={autoConfig} />
        )}
      </main>
    </div>
  );
}

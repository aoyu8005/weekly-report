import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getUserRepos } from "@/lib/github";
import { DashboardClient } from "@/components/DashboardClient";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.accessToken) redirect("/");

  let repos = [];
  let fetchError = "";

  try {
    repos = await getUserRepos(session.accessToken);
  } catch (e) {
    fetchError = e instanceof Error ? e.message : "获取仓库列表失败";
  }

  const userLogin = (session.user?.name ?? session.user?.email ?? "用户") as string;

  return (
    <div className="flex flex-col flex-1 bg-zinc-50 dark:bg-zinc-950 font-sans">
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">📋</span>
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">周报生成工具</span>
          </div>
          <div className="flex items-center gap-4">
            {session.user?.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={session.user.image}
                alt={userLogin}
                className="w-7 h-7 rounded-full"
              />
            )}
            <span className="text-sm text-zinc-600 dark:text-zinc-400">{userLogin}</span>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <button
                type="submit"
                className="text-sm text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
              >
                退出
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-12">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">生成本周周报</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            选择仓库并配置 AI 方式，点击生成后自动汇总最近 7 天的提交记录。
          </p>
        </div>

        {fetchError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30 p-5 text-sm text-red-600 dark:text-red-400">
            获取仓库列表失败：{fetchError}
          </div>
        ) : repos.length === 0 ? (
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 p-10 text-center text-zinc-500 dark:text-zinc-400">
            未找到任何仓库
          </div>
        ) : (
          <DashboardClient repos={repos} userLogin={userLogin} />
        )}
      </main>
    </div>
  );
}

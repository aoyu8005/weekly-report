import { auth, signIn } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth().catch(() => null);
  if (session) redirect("/dashboard");

  return (
    <div className="flex flex-col flex-1 bg-zinc-50 dark:bg-zinc-950 font-sans">
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">📋</span>
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">周报生成工具</span>
          </div>
          <span className="text-sm text-zinc-500 dark:text-zinc-400">v1.0</span>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-24 space-y-10">
        <div className="text-center space-y-4 max-w-lg">
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-100 leading-tight">
            自动生成 Git 周报
          </h1>
          <p className="text-lg text-zinc-500 dark:text-zinc-400 leading-relaxed">
            连接 GitHub，选择仓库，AI 自动归纳本周提交，一键下载 Markdown 周报。
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 text-sm text-zinc-500 dark:text-zinc-400">
          {["GitHub 登录授权", "选择仓库", "AI 生成周报", "下载 .md 文件"].map(
            (step, i) => (
              <div key={step} className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 text-xs flex items-center justify-center font-semibold">
                  {i + 1}
                </span>
                <span>{step}</span>
                {i < 3 && (
                  <span className="hidden sm:block text-zinc-300 dark:text-zinc-600">→</span>
                )}
              </div>
            )
          )}
        </div>

        <form
          action={async () => {
            "use server";
            await signIn("github", { redirectTo: "/dashboard" });
          }}
        >
          <button
            type="submit"
            className="flex items-center gap-3 h-12 px-8 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-medium text-sm hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-colors"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden>
              <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.164 6.839 9.49.5.09.682-.218.682-.484 0-.236-.009-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.268 2.75 1.026A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.337 1.909-1.294 2.747-1.026 2.747-1.026.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.308.678.916.678 1.846 0 1.332-.012 2.407-.012 2.734 0 .267.18.578.688.48C19.138 20.16 22 16.416 22 12c0-5.523-4.477-10-10-10z" />
            </svg>
            使用 GitHub 登录
          </button>
        </form>

        <p className="text-xs text-zinc-400 dark:text-zinc-600 text-center max-w-sm">
          仅申请读取仓库提交记录所需的权限（read:user、repo），不会修改任何数据。
        </p>
      </main>

      <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="max-w-4xl mx-auto px-6 py-4 text-center text-xs text-zinc-400">
          支持 Claude / OpenAI · 无 AI 可直接导出提交记录
        </div>
      </footer>
    </div>
  );
}

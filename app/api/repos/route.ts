import { auth } from "@/lib/auth";
import { getUserRepos } from "@/lib/github";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.accessToken) {
      return Response.json({ error: "未登录" }, { status: 401 });
    }

    const repos = await getUserRepos(session.accessToken);
    return Response.json({ repos });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "未知错误";
    return Response.json({ error: msg }, { status: 500 });
  }
}

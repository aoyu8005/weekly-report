import { auth } from "@/lib/auth";
import { getRepoCommits, GitHubCommit } from "@/lib/github";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.accessToken) {
      return Response.json({ error: "未登录" }, { status: 401 });
    }

    const { repoFullNames } = await request.json();

    const now = new Date();
    const since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const sinceISO = since.toISOString();
    const untilISO = now.toISOString();

    const results = await Promise.allSettled(
      repoFullNames.map((name: string) =>
        getRepoCommits(session.accessToken, name, sinceISO, untilISO)
      )
    );

    const commits = results.flatMap((result, i) => {
      if (result.status === "rejected") return [];
      return result.value.map((commit: GitHubCommit) => ({
        repo: repoFullNames[i],
        sha: commit.sha.slice(0, 7),
        message: commit.commit.message.split("\n")[0],
        date: commit.commit.author.date.slice(0, 10),
        url: commit.html_url,
      }));
    });

    commits.sort((a, b) => b.date.localeCompare(a.date));

    return Response.json({ commits, since: sinceISO, until: untilISO });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "未知错误";
    return Response.json({ error: msg }, { status: 500 });
  }
}

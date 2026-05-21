export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  description: string | null;
  updated_at: string;
}

export interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      date: string;
    };
  };
  html_url: string;
}

const GH_HEADERS = (token: string) => ({
  Authorization: `Bearer ${token}`,
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
});

export async function getUserRepos(accessToken: string): Promise<GitHubRepo[]> {
  const response = await fetch(
    "https://api.github.com/user/repos?per_page=100&sort=updated&type=all",
    { headers: GH_HEADERS(accessToken) }
  );
  if (!response.ok) throw new Error(`GitHub API error: ${response.status}`);
  return response.json();
}

export async function getRepoCommits(
  accessToken: string,
  fullName: string,
  since: string,
  until: string
): Promise<GitHubCommit[]> {
  const url = new URL(`https://api.github.com/repos/${fullName}/commits`);
  url.searchParams.set("since", since);
  url.searchParams.set("until", until);
  url.searchParams.set("per_page", "100");

  const response = await fetch(url.toString(), {
    headers: GH_HEADERS(accessToken),
  });

  if (response.status === 409) return [];
  if (!response.ok) throw new Error(`GitHub API error: ${response.status}`);
  return response.json();
}

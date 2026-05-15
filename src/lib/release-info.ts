/** Public ForgeMail / SMTP repo — used for changelog, releases, and docs links. */
export const GITHUB_REPO = "https://github.com/khayson/SMTP";
export const GITHUB_RELEASES_LATEST = `${GITHUB_REPO}/releases/latest`;
export const CHANGELOG_RAW_URL =
  "https://raw.githubusercontent.com/khayson/SMTP/main/CHANGELOG.md";
export const CHANGELOG_WEB_URL = `${GITHUB_REPO}/blob/main/CHANGELOG.md`;

/** Latest section: [Unreleased] if it has notes, else first numbered release after it. */
export function extractLatestReleaseSection(
  markdown: string
): { heading: string; body: string } | null {
  const lines = markdown.split(/\r?\n/);
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const m = line.match(/^## \[(Unreleased|[\d.]+[^\]]*)\]/);
    if (m) {
      const tag = m[1];
      i++;
      const body: string[] = [];
      while (i < lines.length && !lines[i].startsWith("## ")) {
        body.push(lines[i]);
        i++;
      }
      const bodyStr = body.join("\n").trim();
      if (tag === "Unreleased") {
        const meaningful = /[^\s-]/.test(bodyStr);
        if (meaningful) {
          return { heading: "[Unreleased] — latest on main", body: bodyStr };
        }
        continue;
      }
      return { heading: line.replace(/^## /, "").trim(), body: bodyStr };
    }
    i++;
  }
  return null;
}

let changelogFetchPromise: Promise<string | null> | null = null;

/** Fetches CHANGELOG.md from `main` once per app session (shared cache). */
export function fetchMainChangelogMarkdown(): Promise<string | null> {
  if (!changelogFetchPromise) {
    changelogFetchPromise = fetch(CHANGELOG_RAW_URL, { cache: "no-cache" })
      .then((r) => (r.ok ? r.text() : null))
      .catch(() => null);
  }
  return changelogFetchPromise;
}

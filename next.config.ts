import type { NextConfig } from "next";
import { execFileSync } from "node:child_process";
import packageInfo from "./package.json";
import savedHistory from "./src/data/release-history.json";
import notes from "./src/data/release-notes.json";

function git(args: string[]) {
  try { return execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim(); }
  catch { return ""; }
}
const revision = process.env.VERCEL_GIT_COMMIT_SHA || git(["rev-parse", "HEAD"]) || "dev";
const history = [...savedHistory];
for (const row of git(["log", "--format=%H|%cI|%s"]).split("\n")) {
  const [sha, date, subject] = row.split("|");
  if (!sha || !date || history.some(entry => entry.revision === sha)) continue;
  const oldPackage = git(["show", `${sha}:package.json`]);
  let version: string | null = null;
  try { version = JSON.parse(oldPackage).version; } catch { /* Retain the historical record without guessing a version. */ }
  history.push({ revision: sha, date, version, summary: (notes as Record<string, string>)[subject] || subject });
}
if (revision !== "dev" && !history.some(entry => entry.revision === revision)) {
  const subject = process.env.VERCEL_GIT_COMMIT_MESSAGE || "";
  history.unshift({ revision, date: new Date().toISOString(), version: packageInfo.version, summary: (notes as Record<string, string>)[subject] || subject || "Uygulama güncellendi." });
}
history.sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: `${packageInfo.version}+${revision.slice(0, 12)}`,
    RELEASE_HISTORY_JSON: JSON.stringify(history),
  },
};
export default nextConfig;

import type { NextConfig } from "next";
import { execFileSync } from "node:child_process";
import packageInfo from "./package.json";

function revision() {
  if (process.env.VERCEL_GIT_COMMIT_SHA) return process.env.VERCEL_GIT_COMMIT_SHA;
  try { return execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim(); }
  catch { return "dev"; }
}
const nextConfig: NextConfig = {
  env: { NEXT_PUBLIC_APP_VERSION: `${packageInfo.version}+${revision().slice(0,12)}` },
};
export default nextConfig;

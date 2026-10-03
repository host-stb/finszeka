export type ReleaseRecord = { revision: string; date: string; version: string | null; summary: string };
export function releaseHistory(): ReleaseRecord[] {
  return JSON.parse(process.env.RELEASE_HISTORY_JSON || "[]");
}

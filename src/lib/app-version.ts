/** Fixed at build time: each published Git revision has its own visible version. */
export const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? "1.0.0+dev";

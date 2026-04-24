import { Redis } from "@upstash/redis";

export const kv = Redis.fromEnv();

export function userKey(email: string, kind: "todos" | "scratchpad"): string {
  return `user:${email}:${kind}`;
}

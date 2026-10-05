"use server";
import { headers } from "next/headers";
import { endpoint, sameOrigin } from "@/lib/http";
import { executeAccountCommand } from "@/lib/server/account";
import { site } from "@/lib/config";
export async function accountCommand(input: unknown) {
  const response = await endpoint(async () => {
    sameOrigin(new Request(site.url, { headers: await headers() }));
    return executeAccountCommand(input);
  });
  return { ok: response.ok, data: await response.json() };
}

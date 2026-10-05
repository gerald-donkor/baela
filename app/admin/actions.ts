"use server";
import { headers } from "next/headers";
import { endpoint, sameOrigin } from "@/lib/http";
import { executeAdminCommand } from "@/lib/server/admin";
import { site } from "@/lib/config";
export async function adminCommand(input: unknown) {
  const response = await endpoint(async () => {
    sameOrigin(new Request(site.url, { headers: await headers() }));
    return executeAdminCommand(input);
  });
  return { ok: response.ok, data: await response.json() };
}

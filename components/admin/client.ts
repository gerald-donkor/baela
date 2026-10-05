"use client";
import { adminCommand } from "@/app/admin/actions";
export async function command(body: unknown, path = "/api/admin") {
  if (path === "/api/admin") {
    const result = await adminCommand(body);
    if (!result.ok)
      throw new Error(result.data.error || "Unable to save changes.");
    return result.data;
  }
  const r = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || "Unable to save changes.");
  return data;
}

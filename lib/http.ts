import "server-only";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import * as Sentry from "@sentry/nextjs";
import { site } from "./config";
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(site.url).origin)
    throw new HttpError(403, "Request origin is not allowed.");
}
export async function endpoint(fn: () => Promise<unknown>) {
  try {
    const result = await fn();
    return result instanceof Response
      ? result
      : NextResponse.json(result, {
          headers: { "Cache-Control": "private, no-store" },
        });
  } catch (error) {
    if (error instanceof HttpError)
      return NextResponse.json(
        { error: error.message },
        {
          status: error.status,
          headers: { "Cache-Control": "private, no-store" },
        },
      );
    if (error instanceof ZodError)
      return NextResponse.json(
        { error: error.issues.map((i) => i.message).join(" ") },
        { status: 400, headers: { "Cache-Control": "private, no-store" } },
      );
    Sentry.captureException(error);
    return NextResponse.json(
      { error: "We couldn’t complete that request. Please try again." },
      { status: 500, headers: { "Cache-Control": "private, no-store" } },
    );
  }
}

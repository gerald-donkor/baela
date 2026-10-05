import "server-only";
import { z } from "zod";
import { required } from "@/lib/config";
import { providerSignal } from "./job-budget";
export async function polarApi(
  path: string,
  method = "GET",
  body?: unknown,
  idempotencyKey?: string,
): Promise<unknown> {
  const base =
    process.env.POLAR_SERVER === "production"
      ? "https://api.polar.sh"
      : "https://sandbox-api.polar.sh";
  const response = await fetch(base + "/v1" + path, {
    method,
    cache: "no-store",
    signal: providerSignal(),
    headers: {
      Authorization: "Bearer " + required("POLAR_ACCESS_TOKEN"),
      "Content-Type": "application/json",
      "Polar-Version": "2026-04",
      ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok)
    throw new Error(
      "Polar request failed (" +
        response.status +
        ") for " +
        path.split("/")[1],
    );
  if (response.status === 204) return {};
  return response.json();
}
const date = z.coerce.date();
const customer = z.object({
  id: z.string(),
  external_id: z.string().nullable(),
});
export const providerSubscription = z.object({
  id: z.string(),
  customer,
  product_id: z.string(),
  status: z.string(),
  current_period_start: date,
  current_period_end: date,
  cancel_at_period_end: z.boolean(),
  modified_at: date.nullish(),
  created_at: date,
  ends_at: date.nullish(),
});
export const providerPeriod = z.object({
  current_period_start: date,
  current_period_end: date,
});
export const providerOrder = z.object({
  id: z.string(),
  customer,
  product_id: z.string(),
  checkout_id: z.string().nullish(),
  subscription_id: z.string().nullable(),
  subscription: providerPeriod.nullish(),
  net_amount: z.number().int(),
  refunded_amount: z.number().int(),
  currency: z.string(),
  paid: z.boolean(),
  status: z.string(),
  modified_at: date.nullish(),
  created_at: date,
});
export const providerProduct = z.object({
  id: z.string(),
  is_archived: z.boolean(),
  is_recurring: z.boolean(),
  recurring_interval: z.string().nullable(),
  recurring_interval_count: z.number().nullable(),
  prices: z.array(
    z.object({
      id: z.string(),
      price_amount: z.number().int().optional(),
      price_currency: z.string().optional(),
      is_archived: z.boolean().optional(),
    }),
  ),
});

// Mapping, webhooks, and checkout must agree on the product being sold.
export function offerPrice(
  product: z.infer<typeof providerProduct>,
  kind: "course" | "monthly" | "lifetime",
) {
  if (
    product.is_archived ||
    (kind === "monthly"
      ? !product.is_recurring ||
        product.recurring_interval !== "month" ||
        product.recurring_interval_count !== 1
      : product.is_recurring)
  )
    return null;
  const prices = product.prices.filter((price) => !price.is_archived);
  const price = prices[0];
  return prices.length === 1 &&
    price.price_currency === "usd" &&
    price.price_amount !== undefined &&
    price.price_amount > 0
    ? price
    : null;
}

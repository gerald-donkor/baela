export const site = {
  name: "Baela",
  description:
    "Make room for your next chapter. Thoughtful courses, practical lessons, and learning at your own pace.",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
};
export const launchPrices = {
  course: 833,
  monthly: 1667,
  lifetime: 8333,
} as const;
export const uploadLimits = {
  video: 2_000_000_000,
  image: 10_000_000,
  attachment: 50_000_000,
} as const;
export function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error("Missing server configuration: " + name);
  return value;
}

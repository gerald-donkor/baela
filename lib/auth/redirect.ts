export function getAuthRedirect(value: unknown): string {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    /[\\\u0000-\u001f\u007f]/.test(value)
  )
    return "/dashboard";

  const url = new URL(value, "https://baela.invalid");
  if (url.origin !== "https://baela.invalid" || url.pathname.startsWith("//"))
    return "/dashboard";
  return url.pathname + url.search + url.hash;
}

export function streamingLadder(height: number) {
  const heights = [360, 480, 720, 1080].filter((value) => value <= height);
  return heights.length ? "sr-" + heights.join("_") : null;
}
export function allowedMediaUrl(
  input: string,
  endpoint: string,
  filePath: string,
) {
  const root = new URL(endpoint.endsWith("/") ? endpoint : endpoint + "/");
  const base = new URL(filePath.replace(/^\//, ""), root);
  let target: URL;
  try {
    target = new URL(input);
  } catch {
    return false;
  }
  if (
    target.origin !== base.origin ||
    target.username ||
    target.password ||
    target.hash
  )
    return false;
  const suffix = target.pathname.slice(base.pathname.length);
  if (!target.pathname.startsWith(base.pathname)) return false;
  // Only ImageKit-generated HLS paths belonging to this exact source asset.
  if (
    suffix !== "" &&
    !/^\/(?:ik-master\.m3u8|ik-thumbnail\.jpg|[a-zA-Z0-9_./-]+\.(?:m3u8|ts|m4s|mp4))$/.test(
      suffix,
    )
  )
    return false;
  if (suffix.includes("..") || /%2f|%2e|%5c/i.test(target.pathname))
    return false;
  for (const key of target.searchParams.keys())
    if (!["tr", "ik-s", "ik-t"].includes(key)) return false;
  const transformation = target.searchParams.get("tr");
  return (
    !transformation ||
    /^(?:sr-360_480_720_1080|sr-360_480_720|sr-360_480|sr-360|h-\d+,w-\d+)$/.test(
      transformation,
    )
  );
}

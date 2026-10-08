import "server-only";
import ImageKit from "@imagekit/nodejs";
import { required } from "@/lib/config";
export function imagekitPublicKey() {
  return (
    process.env.IMAGEKIT_PUBLIC_KEY ||
    required("NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY")
  );
}
export function imagekitUrlEndpoint() {
  return (
    process.env.IMAGEKIT_URL_ENDPOINT ||
    required("NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT")
  );
}
export function imagekitUploadFolder() {
  const folder =
    "/" + (process.env.IMAGEKIT_FOLDER || "baela").replace(/^\/+|\/+$/g, "");
  if (!/^\/[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)*$/.test(folder))
    throw new Error("ImageKit upload folder must contain valid folder names.");
  return folder;
}
export function isImageKitConfigured() {
  return !!(
    process.env.IMAGEKIT_PRIVATE_KEY &&
    (process.env.IMAGEKIT_PUBLIC_KEY ||
      process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY) &&
    (process.env.IMAGEKIT_URL_ENDPOINT ||
      process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT)
  );
}
export const imagekit = () =>
  new ImageKit({ privateKey: required("IMAGEKIT_PRIVATE_KEY") });
export function signedAsset(
  path: string,
  expiresIn = 300,
  transformation?: string,
) {
  return imagekit().helper.buildSrc({
    urlEndpoint: imagekitUrlEndpoint(),
    src: path,
    signed: true,
    expiresIn,
    queryParameters: transformation ? { tr: transformation } : {},
  });
}

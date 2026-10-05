import "server-only";
import ImageKit from "@imagekit/nodejs";
import { required } from "@/lib/config";
export const imagekit = () =>
  new ImageKit({ privateKey: required("IMAGEKIT_PRIVATE_KEY") });
export function signedAsset(
  path: string,
  expiresIn = 300,
  transformation?: string,
) {
  return imagekit().helper.buildSrc({
    urlEndpoint: required("NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT"),
    src: path,
    signed: true,
    expiresIn,
    queryParameters: transformation ? { tr: transformation } : {},
  });
}

import type { MetadataRoute } from "next";
import { site } from "@/lib/config";
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/account",
        "/dashboard",
        "/learn",
        "/auth",
        "/api",
        "/checkout",
      ],
    },
    sitemap: site.url + "/sitemap.xml",
  };
}

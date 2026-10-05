import type { MetadataRoute } from "next";
import { catalog } from "@/lib/server/catalog";
import { site } from "@/lib/config";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return [
    { url: site.url, changeFrequency: "weekly", priority: 1 },
    ...(await catalog()).map(({ course }) => ({
      url: site.url + "/courses/" + course.slug,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}

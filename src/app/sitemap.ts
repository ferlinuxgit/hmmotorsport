import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/config/site";
import { getSiteNavigation } from "@/lib/modules/loader";

function normalizePublicPath(href: string) {
  const [path = "/"] = href.split("#");
  return path.startsWith("/") ? path : "/";
}

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  const publicPaths = new Set(["/", ...getSiteNavigation().map((item) => normalizePublicPath(item.href))]);
  const now = new Date();

  return [...publicPaths].map((path) => ({
    url: new URL(path, siteUrl).toString(),
    lastModified: now,
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : 0.7
  }));
}

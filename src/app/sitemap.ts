import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/config/site";
import { serviceDetails } from "@/lib/hm-content";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  const publicPaths = new Set([
    "/",
    "/servicios",
    "/quienes-somos",
    "/contacto",
    "/privacy",
    "/terms",
    ...Object.keys(serviceDetails).map((slug) => `/servicios/${slug}`)
  ]);
  const now = new Date();

  return [...publicPaths].map((path) => ({
    url: new URL(path, siteUrl).toString(),
    lastModified: now,
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: getPriority(path)
  }));
}

function getPriority(path: string) {
  if (path === "/") return 1;
  if (path.startsWith("/servicios")) return 0.9;
  if (path === "/privacy" || path === "/terms") return 0.2;
  return 0.7;
}

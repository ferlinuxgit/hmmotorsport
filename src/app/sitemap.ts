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
    priority: path === "/" ? 1 : 0.7
  }));
}

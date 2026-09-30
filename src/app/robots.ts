import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/config/site";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl().toString();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/account", "/dashboard", "/api"]
      }
    ],
    sitemap: new URL("/sitemap.xml", siteUrl).toString()
  };
}

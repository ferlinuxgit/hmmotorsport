import type { MetadataRoute } from "next";

import { siteConfig } from "@/lib/config/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteConfig.name,
    short_name: siteConfig.name,
    description: siteConfig.description,
    start_url: "/",
    display: "standalone",
    background_color: "#080808",
    theme_color: "#ed1111",
    lang: "es",
    icons: [
      {
        src: "/icon",
        sizes: "64x64",
        type: "image/png"
      }
    ]
  };
}

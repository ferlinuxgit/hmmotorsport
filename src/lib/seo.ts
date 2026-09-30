import type { Metadata } from "next";

import { getSiteUrl, siteConfig } from "@/lib/config/site";
import { contact } from "@/lib/hm-content";

type PageMetadataInput = {
  title: string;
  description: string;
  path: string;
  image?: { url: string; alt: string };
  absoluteTitle?: boolean;
};

const defaultImage = { url: "/opengraph-image", width: 1200, height: 630, alt: siteConfig.name };

export function pageMetadata({ title, description, path, image, absoluteTitle = false }: PageMetadataInput): Metadata {
  const socialTitle = absoluteTitle ? title : `${title} | ${siteConfig.name}`;
  const images = image ? [image] : [defaultImage];

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      locale: siteConfig.locale,
      siteName: siteConfig.name,
      url: path,
      title: socialTitle,
      description,
      images
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: images.map((item) => item.url)
    }
  };
}

export function absoluteUrl(path: string) {
  return new URL(path, getSiteUrl()).toString();
}

export const businessId = absoluteUrl("/#business");
export const websiteId = absoluteUrl("/#website");

export function businessJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "AutoRepair",
        "@id": businessId,
        name: siteConfig.name,
        description: siteConfig.description,
        url: absoluteUrl("/"),
        logo: absoluteUrl("/web-app-manifest-512x512.png"),
        image: [absoluteUrl("/images/hm/hero-workshop.jpg"), absoluteUrl("/images/hm/banco-potencia-frontal.jpeg")],
        telephone: `+${contact.electronics.phone}`,
        email: contact.email,
        address: {
          "@type": "PostalAddress",
          streetAddress: "Av. de la Libertad, 160",
          postalCode: "03340",
          addressLocality: "Albatera",
          addressRegion: "Alicante",
          addressCountry: "ES"
        },
        hasMap: contact.maps,
        areaServed: ["Alicante", "Murcia", "Comunidad Valenciana", "España"],
        contactPoint: [
          { "@type": "ContactPoint", contactType: "customer service", name: contact.electronics.label, telephone: `+${contact.electronics.phone}`, availableLanguage: "es" },
          { "@type": "ContactPoint", contactType: "customer service", name: contact.mechanics.label, telephone: `+${contact.mechanics.phone}`, availableLanguage: "es" }
        ],
        sameAs: [contact.instagram]
      },
      {
        "@type": "WebSite",
        "@id": websiteId,
        name: siteConfig.name,
        url: absoluteUrl("/"),
        inLanguage: "es-ES",
        publisher: { "@id": businessId }
      }
    ]
  };
}

export function breadcrumbJsonLd(items: readonly { name: string; path: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path)
    }))
  };
}

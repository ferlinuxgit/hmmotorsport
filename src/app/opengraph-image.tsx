import { ImageResponse } from "next/og";

import { siteConfig } from "@/lib/config/site";

export const size = {
  width: 1200,
  height: 630
};

export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "#f8fafc",
          color: "#111827",
          display: "flex",
          flexDirection: "column",
          fontFamily: "Arial, sans-serif",
          height: "100%",
          justifyContent: "center",
          padding: "72px",
          width: "100%"
        }}
      >
        <div style={{ color: "#2563eb", fontSize: 28, fontWeight: 700, marginBottom: 28 }}>Base Boilerplate</div>
        <div style={{ fontSize: 76, fontWeight: 800, letterSpacing: "-2px", lineHeight: 1.05, textAlign: "center" }}>
          {siteConfig.name}
        </div>
        <div style={{ color: "#475569", fontSize: 34, lineHeight: 1.35, marginTop: 32, maxWidth: 900, textAlign: "center" }}>
          {siteConfig.description}
        </div>
      </div>
    ),
    size
  );
}

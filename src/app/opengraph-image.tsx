import { ImageResponse } from "next/og";

import { siteConfig } from "@/lib/config/site";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    <div style={{ background: "#080808", color: "#f5f5f5", display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between", padding: "70px", width: "100%" }}>
      <div style={{ alignItems: "center", display: "flex", fontFamily: "Arial, sans-serif", fontSize: 28, fontStyle: "italic", fontWeight: 900, gap: 14 }}><span style={{ background: "#ed1111", padding: "10px 14px" }}>HM</span> MOTORSPORT</div>
      <div style={{ fontFamily: "Arial, sans-serif", fontSize: 76, fontWeight: 800, letterSpacing: "-4px", lineHeight: 0.95, maxWidth: 1000, textTransform: "uppercase" }}>Electrónica y mecánica de alto rendimiento.</div>
      <div style={{ alignItems: "center", color: "#999", display: "flex", fontFamily: "monospace", fontSize: 20, justifyContent: "space-between", textTransform: "uppercase" }}><span>{siteConfig.name}</span><span>Albatera · Alicante</span></div>
    </div>,
    size
  );
}

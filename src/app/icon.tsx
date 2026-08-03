import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div style={{ alignItems: "center", background: "#ed1111", color: "white", display: "flex", fontFamily: "Arial, sans-serif", fontSize: 25, fontStyle: "italic", fontWeight: 900, height: "100%", justifyContent: "center", letterSpacing: "-2px", width: "100%" }}>HM</div>,
    size
  );
}

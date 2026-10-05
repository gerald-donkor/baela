import { ImageResponse } from "next/og";
export const alt = "Baela — Make room for your next chapter";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default function Image() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 80,
        background: "#eef1e9",
        color: "#202921",
      }}
    >
      <div style={{ fontSize: 54, fontWeight: 700 }}>baela.</div>
      <div style={{ fontSize: 76, maxWidth: 900, lineHeight: 1.05 }}>
        Make room for your next chapter.
      </div>
      <div style={{ fontSize: 26, color: "#3a6845" }}>
        Thoughtful courses. Practical lessons. Your pace.
      </div>
    </div>,
    size,
  );
}

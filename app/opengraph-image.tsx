import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const font = readFile(
  join(
    process.cwd(),
    "node_modules/geist/dist/fonts/geist-sans/Geist-Medium.ttf",
  ),
);
export const alt = "Baela — Make room for your next chapter";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default async function Image() {
  const fontData = await font;
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        paddingTop: 120,
        background: "#050919",
        color: "#f2f4fc",
        fontFamily: "Geist",
      }}
    >
      <svg
        width="1200"
        height="630"
        viewBox="0 0 1200 630"
        style={{ position: "absolute", top: 0, left: 0 }}
      >
        <defs>
          <linearGradient id="horizon" x1="0%" x2="100%">
            <stop offset="0" stopColor="#050919" />
            <stop offset="0.35" stopColor="#a6bfff" />
            <stop offset="0.5" stopColor="#d5f2ff" />
            <stop offset="0.65" stopColor="#a6bfff" />
            <stop offset="1" stopColor="#050919" />
          </linearGradient>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="14" />
          </filter>
        </defs>
        <path
          d="M100 450C250 45 950 45 1100 450"
          fill="none"
          stroke="url(#horizon)"
          strokeWidth="20"
          opacity="0.55"
          filter="url(#glow)"
        />
        <path
          d="M100 450C250 45 950 45 1100 450"
          fill="none"
          stroke="url(#horizon)"
          strokeWidth="4"
          opacity="0.25"
        />
        <path
          d="M100 450C250 45 950 45 1100 450"
          fill="none"
          stroke="url(#horizon)"
          strokeWidth="2"
        />
      </svg>
      <div
        style={{
          position: "absolute",
          top: 50,
          left: 64,
          display: "flex",
          alignItems: "center",
          gap: 14,
          fontSize: 36,
          letterSpacing: -2,
        }}
      >
        <svg width="30" height="35" viewBox="0 0 25 29">
          <path
            d="M12.5 0L16.1 10.9L25 14.5L16.1 18.1L12.5 29L8.9 18.1L0 14.5L8.9 10.9L12.5 0Z"
            fill="#a6bfff"
          />
        </svg>
        baela
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          fontSize: 76,
          letterSpacing: -4,
          lineHeight: 1.09,
        }}
      >
        <span>Make room for your</span>
        <span>next chapter.</span>
      </div>
      <div style={{ fontSize: 24, color: "#9aa7c2", marginTop: 36 }}>
        Thoughtful courses. Practical lessons. Your pace.
      </div>
    </div>,
    {
      ...size,
      fonts: [
        {
          name: "Geist",
          data: Uint8Array.from(fontData).buffer,
          weight: 500,
          style: "normal",
        },
      ],
    },
  );
}

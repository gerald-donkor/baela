import { readFile, writeFile } from "node:fs/promises";
import { Euler, Vector3 } from "three";

// A deterministic companion to the WebGL globe, also used for reduced motion.
// Run from the repository root: node scripts/generate-auth-globe.mjs
const land = JSON.parse(
  await readFile("public/images/landing/land-points.json", "utf8"),
);
const rotation = new Euler(0.12, -0.28, -0.12);
const scale = 470 / 2.48;
const project = (longitude, latitude) => {
  const lon = (longitude * Math.PI) / 180;
  const lat = (latitude * Math.PI) / 180;
  const point = new Vector3(
    Math.cos(lat) * Math.sin(lon),
    Math.sin(lat),
    Math.cos(lat) * Math.cos(lon),
  ).applyEuler(rotation);
  return { x: 325 + point.x * scale, y: 235 - point.y * scale, z: point.z };
};
const dots = land
  .map(([lon, lat]) => {
    const point = project(lon, lat);
    if (point.z < 0.05) return "";
    return `<circle cx="${point.x.toFixed(2)}" cy="${point.y.toFixed(2)}" r="0.65" opacity="${(Math.min(point.z * 3, 1) * 0.65).toFixed(2)}"/>`;
  })
  .join("");
const stars = Array.from({ length: 60 }, (_, index) => {
  const noise = (seed) => {
    const value = Math.sin(seed * 127.1) * 43758.5453;
    return value - Math.floor(value);
  };
  return `<circle cx="${(noise(index + 1) * 650).toFixed(2)}" cy="${(noise(index + 61) * 470).toFixed(2)}" r="${(0.3 + noise(index + 121) * 0.65).toFixed(2)}" opacity="0.45"/>`;
}).join("");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 650 470" fill="none">
<defs>
  <radialGradient id="glow"><stop stop-color="#739aff" stop-opacity=".25"/><stop offset=".75" stop-color="#587bdf" stop-opacity=".08"/><stop offset="1" stop-color="#587bdf" stop-opacity="0"/></radialGradient>
  <radialGradient id="ocean" cx=".42" cy=".3" r=".72"><stop stop-color="#102049"/><stop offset=".75" stop-color="#050e28"/><stop offset="1" stop-color="#1c3c84"/></radialGradient>
  <linearGradient id="rim" x1="325" y1="35" x2="325" y2="435" gradientUnits="userSpaceOnUse"><stop stop-color="#d0e0ff"/><stop offset=".5" stop-color="#799eee" stop-opacity=".6"/><stop offset="1" stop-color="#4267c4" stop-opacity=".1"/></linearGradient>
  <filter id="blur"><feGaussianBlur stdDeviation="6"/></filter>
</defs>
<g fill="#9ebcff">${stars}</g>
<ellipse cx="325" cy="235" rx="268" ry="225" fill="url(#glow)"/>
<g stroke="#789fed" stroke-opacity=".23"><ellipse cx="325" cy="235" rx="239" ry="212" transform="rotate(-18 325 235)"/><ellipse cx="325" cy="235" rx="244" ry="98" transform="rotate(-25 325 235)"/></g>
<circle cx="325" cy="235" r="193" stroke="#759dff" stroke-width="9" stroke-opacity=".25" filter="url(#blur)"/>
<circle cx="325" cy="235" r="189.5" fill="url(#ocean)" stroke="url(#rim)" stroke-width="1.5"/>
<g fill="#a3beff">${dots}</g>
<g stroke="#a4c0ff" stroke-width=".9" stroke-opacity=".45">
<path d="M217 176Q304 104 368 160"/><path d="M283 290Q241 181 368 160"/><path d="M368 160Q406 146 444 215"/><path d="M283 290Q371 208 444 215"/>
</g>
<g fill="#d6e5ff"><circle cx="217" cy="176" r="2.2"/><circle cx="368" cy="160" r="2.2"/><circle cx="283" cy="290" r="2.2"/><circle cx="444" cy="215" r="2.2"/></g>
</svg>`;
await writeFile("public/images/auth/globe.svg", svg);

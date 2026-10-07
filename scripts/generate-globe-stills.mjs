import { readFile, writeFile } from "node:fs/promises";
import { Euler, Vector3 } from "three";

// Static companions use exactly the same geographic data as the WebGL globes.
const land = JSON.parse(
  await readFile("public/images/landing/land-points.json", "utf8"),
);
const borders = JSON.parse(
  await readFile("public/images/landing/country-borders.json", "utf8"),
);
for (const [file, width, height, cx, cy, radius, rotation] of [
  [
    "public/images/auth/globe.svg",
    650,
    470,
    325,
    235,
    470 / 2.48,
    new Euler(0.12, -0.28, -0.12),
  ],
  [
    "public/images/landing/hero-globe.svg",
    1672,
    941,
    836,
    941 * 0.931,
    1672 * 0.43,
    new Euler(),
  ],
]) {
  const project = (lon, lat) => {
    lon *= Math.PI / 180;
    lat *= Math.PI / 180;
    const p = new Vector3(
      Math.cos(lat) * Math.sin(lon),
      Math.sin(lat),
      Math.cos(lat) * Math.cos(lon),
    ).applyEuler(rotation);
    return { x: cx + p.x * radius, y: cy - p.y * radius, z: p.z };
  };
  const dots = land
    .map(([lon, lat]) => {
      const p = project(lon, lat);
      return p.z < 0.03
        ? ""
        : `<circle cx="${p.x.toFixed(2)}" cy="${p.y.toFixed(2)}" r="${radius / 300}" opacity="${(Math.min(p.z * 3, 1) * 0.8).toFixed(2)}"/>`;
    })
    .join("");
  const paths = borders
    .map((ring) => {
      let d = "",
        visible = false;
      for (const [lon, lat] of ring) {
        const p = project(lon, lat);
        if (p.z < 0.02) {
          visible = false;
          continue;
        }
        d += `${visible ? "L" : "M"}${p.x.toFixed(2)} ${p.y.toFixed(2)}`;
        visible = true;
      }
      return `<path d="${d}"/>`;
    })
    .join("");
  await writeFile(
    file,
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" fill="none"><defs><radialGradient id="ocean"><stop stop-color="#08132b"/><stop offset=".88" stop-color="#030919"/><stop offset="1" stop-color="#254da0"/></radialGradient><filter id="glow"><feGaussianBlur stdDeviation="${radius * 0.025}"/></filter></defs><circle cx="${cx}" cy="${cy}" r="${radius}" stroke="#789dff" stroke-width="${radius * 0.04}" filter="url(#glow)" opacity=".6"/><circle cx="${cx}" cy="${cy}" r="${radius}" fill="url(#ocean)" stroke="#abc5ff" stroke-width="1.5"/><g fill="#a3beff">${dots}</g><g stroke="#769be8" stroke-width=".6" opacity=".4">${paths}</g></svg>`,
  );
}

// Natural Earth land outlines are public domain:
// https://github.com/nvkelso/natural-earth-vector
// Usage: node scripts/generate-globe-points.mjs /path/to/ne_50m_admin_0_countries.geojson
import { readFileSync, writeFileSync } from "node:fs";

const land = JSON.parse(readFileSync(process.argv[2], "utf8"));
const polygons = land.features
  .flatMap(({ geometry }) =>
    geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates,
  )
  .map((rings) => ({
    rings,
    bounds: rings[0].reduce(
      ([west, south, east, north], [lon, lat]) => [
        Math.min(west, lon),
        Math.min(south, lat),
        Math.max(east, lon),
        Math.max(north, lat),
      ],
      [180, 90, -180, -90],
    ),
  }));

function inside(lon, lat, ring) {
  let result = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [x, y] = ring[i];
    const [px, py] = ring[j];
    if (y > lat !== py > lat && lon < ((px - x) * (lat - y)) / (py - y) + x)
      result = !result;
  }
  return result;
}

const points = [];
for (let lat = -89.5; lat <= 89.5; lat += 0.65) {
  const spacing = 0.65 / Math.cos((lat * Math.PI) / 180);
  for (let lon = -180; lon < 180; lon += spacing) {
    const onLand = polygons.some(
      ({ bounds: [west, south, east, north], rings }) =>
        lon >= west &&
        lon <= east &&
        lat >= south &&
        lat <= north &&
        inside(lon, lat, rings[0]) &&
        !rings.slice(1).some((ring) => inside(lon, lat, ring)),
    );
    if (onLand) points.push([Number(lon.toFixed(3)), Number(lat.toFixed(3))]);
  }
}
writeFileSync(
  "public/images/landing/land-points.json",
  JSON.stringify(points) + "\n",
);
console.log(`Generated ${points.length} land points.`);

// Keep each undirected segment once, including borders shared by countries.
// Split paths at removed segments so consumers never connect across a gap.
const borders = [];
const segments = new Set();
for (const { rings } of polygons) {
  for (const ring of rings) {
    const coordinates = ring.map(([lon, lat]) => [
      Number(lon.toFixed(3)),
      Number(lat.toFixed(3)),
    ]);
    let path = [];
    for (let i = 1; i < coordinates.length; i++) {
      const start = coordinates[i - 1];
      const end = coordinates[i];
      const a = start.join(",");
      const b = end.join(",");
      if (a === b) continue;
      const key = a < b ? `${a}|${b}` : `${b}|${a}`;
      if (segments.has(key)) {
        if (path.length > 1) borders.push(path);
        path = [];
        continue;
      }
      segments.add(key);
      if (!path.length) path.push(start);
      path.push(end);
    }
    if (path.length > 1) borders.push(path);
  }
}
writeFileSync(
  "public/images/landing/country-borders.json",
  JSON.stringify(borders) + "\n",
);
console.log(`Generated ${segments.size} unique border segments.`);

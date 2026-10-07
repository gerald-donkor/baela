// Natural Earth land outlines are public domain:
// https://github.com/nvkelso/natural-earth-vector
// Usage: node scripts/generate-globe-points.mjs /path/to/ne_110m_land.geojson
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
for (let lat = -84; lat <= 84; lat += 1.2) {
  const spacing = 1.2 / Math.cos((lat * Math.PI) / 180);
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

import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { expect, test } from "vitest";

type Coordinate = [number, number];
const segmentKey = (a: Coordinate, b: Coordinate) =>
  [a.join(","), b.join(",")].sort().join("|");

test("generation retains each coastline and reversed shared border once without bridging gaps", () => {
  const rings: Coordinate[][] = [
    [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
      [0, 0],
    ],
    [
      [1, 0],
      [2, 0],
      [2, 1],
      [1, 1],
      [1, 0],
    ],
    [
      [0, 1],
      [1, 1],
      [1, 2],
      [0, 2],
      [0, 1],
    ],
  ];
  const output = new Map<string, string>();
  const source = JSON.stringify({
    features: rings.map((ring) => ({
      geometry: { type: "Polygon", coordinates: [ring] },
    })),
  });
  // Run the CLI with in-memory I/O so the fixture cannot overwrite real assets.
  const script = readFileSync(
    "scripts/generate-globe-points.mjs",
    "utf8",
  ).replace(/^import .* from "node:fs";$/m, "");
  runInNewContext(script, {
    process: {
      argv: ["node", "generate-globe-points.mjs", "countries.geojson"],
    },
    readFileSync: () => source,
    writeFileSync: (path: string, data: string) => output.set(path, data),
    console: { log() {} },
  });
  const paths: Coordinate[][] = JSON.parse(
    output.get("public/images/landing/country-borders.json")!,
  );
  const actual = paths.flatMap((path) =>
    path.slice(1).map((end, i) => segmentKey(path[i], end)),
  );
  const expected = new Set(
    rings.flatMap((ring) =>
      ring.slice(1).map((end, i) => segmentKey(ring[i], end)),
    ),
  );
  expect(new Set(actual)).toEqual(expected);
  expect(actual).toHaveLength(expected.size);
});

test("committed globe geography has no duplicate or zero-length border segments", () => {
  const paths: Coordinate[][] = JSON.parse(
    readFileSync("public/images/landing/country-borders.json", "utf8"),
  );
  const segments = paths.flatMap((path) =>
    path.slice(1).map((end, i) => {
      expect(end).not.toEqual(path[i]);
      return segmentKey(path[i], end);
    }),
  );
  expect(new Set(segments).size).toBe(segments.length);
});

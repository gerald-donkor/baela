import { Vector3 } from "three";

// The supplied artwork arranges the whole world on the visible hemisphere.
// Reconstruct that hemisphere rather than substituting a different map view.
export const globeProjection = {
  width: 1672,
  height: 941,
  radius: 1672 * 0.43,
  centerX: 1672 / 2,
  centerY: 941 * 0.931,
};

export function artworkLocation(x: number, y: number, radius = 1.009) {
  const horizontal = (x - globeProjection.centerX) / globeProjection.radius;
  const vertical = (globeProjection.centerY - y) / globeProjection.radius;
  return new Vector3(
    horizontal,
    vertical,
    Math.sqrt(Math.max(0, 1 - horizontal ** 2 - vertical ** 2)),
  )
    .normalize()
    .multiplyScalar(radius);
}

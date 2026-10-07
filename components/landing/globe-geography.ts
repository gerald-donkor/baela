import {
  BufferGeometry,
  Float32BufferAttribute,
  Group,
  LineSegments,
  ShaderMaterial,
  Vector3,
} from "three";

// Longitude zero faces the camera; east turns toward the right.
export function geographicLocation(
  longitude: number,
  latitude: number,
  radius = 1.009,
) {
  const lon = (longitude * Math.PI) / 180;
  const lat = (latitude * Math.PI) / 180;
  return new Vector3(
    Math.cos(lat) * Math.sin(lon),
    Math.sin(lat),
    Math.cos(lat) * Math.cos(lon),
  ).multiplyScalar(radius);
}

export function createCountryBorders(
  globe: Group,
  rings: [number, number][][],
) {
  const positions: number[] = [];
  for (const ring of rings) {
    for (let i = 1; i < ring.length; i++) {
      const start = geographicLocation(...ring[i - 1], 1.004);
      const end = geographicLocation(...ring[i], 1.004);
      // Densify long segments to follow the surface instead of cutting into it.
      const steps = Math.max(1, Math.ceil(start.angleTo(end) / 0.015));
      for (let step = 0; step < steps; step++) {
        positions.push(
          ...start
            .clone()
            .lerp(end, step / steps)
            .normalize()
            .multiplyScalar(1.004)
            .toArray(),
        );
        positions.push(
          ...start
            .clone()
            .lerp(end, (step + 1) / steps)
            .normalize()
            .multiplyScalar(1.004)
            .toArray(),
        );
      }
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  const material = new ShaderMaterial({
    vertexShader: `
      varying float visibility;
      void main() {
        vec3 facing = normalize(mat3(modelViewMatrix) * normalize(position));
        visibility = smoothstep(0.0, 0.16, facing.z);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying float visibility;
      void main() {
        gl_FragColor = vec4(0.42, 0.59, 0.95, visibility * 0.35);
      }
    `,
    transparent: true,
    depthWrite: false,
  });
  const lines = new LineSegments(geometry, material);
  globe.add(lines);
  return {
    dispose() {
      lines.removeFromParent();
      geometry.dispose();
      material.dispose();
    },
  };
}

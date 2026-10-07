import {
  AdditiveBlending,
  BackSide,
  BufferGeometry,
  CatmullRomCurve3,
  Float32BufferAttribute,
  Group,
  Mesh,
  Points,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  TubeGeometry,
} from "three";
import { geographicLocation } from "./globe-geography";

// Actual city coordinates distribute hubs and routes around the entire Earth.
const cities = [
  [-74.006, 40.713], // New York
  [-0.128, 51.507], // London
  [2.352, 48.857], // Paris
  [-0.187, 5.603], // Accra
  [-46.633, -23.551], // São Paulo
  [36.822, -1.292], // Nairobi
  [55.27, 25.205], // Dubai
  [72.878, 19.076], // Mumbai
  [103.82, 1.352], // Singapore
  [139.692, 35.69], // Tokyo
  [18.424, -33.925], // Cape Town
  [151.209, -33.869], // Sydney
  [-99.133, 19.433], // Mexico City
  [-122.419, 37.775], // San Francisco
  [-123.121, 49.283], // Vancouver
  [-70.669, -33.449], // Santiago
  [126.978, 37.566], // Seoul
  [174.764, -36.849], // Auckland
  [116.407, 39.904], // Beijing
];
const connections = [
  [0, 1],
  [0, 2],
  [0, 3],
  [4, 1],
  [4, 2],
  [4, 6],
  [4, 3],
  [4, 5],
  [4, 0],
  [4, 12],
  [12, 1],
  [12, 2],
  [12, 3],
  [3, 2],
  [10, 2],
  [1, 7],
  [1, 8],
  [1, 9],
  [6, 9],
  [11, 8],
  [13, 9],
  [13, 14],
  [14, 16],
  [15, 4],
  [15, 13],
  [9, 16],
  [16, 18],
  [18, 7],
  [17, 11],
  [17, 15],
  [11, 9],
];

const routeVertex = `
  varying float progress;
  void main() {
    progress = uv.x;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const routeFragment = `
  uniform float elapsed;
  uniform float offset;
  uniform float strength;
  varying float progress;
  void main() {
    float phase = fract(elapsed / 10.0 + offset);
    float head = phase / 0.48;
    float travel = exp(-pow((progress - head) / 0.045, 2.0));
    float tail = smoothstep(head - 0.75, head - 0.04, progress)
      * (1.0 - smoothstep(head - 0.008, head + 0.025, progress));
    float fade = smoothstep(0.0, 0.035, phase) * (1.0 - smoothstep(0.48, 0.64, phase));
    float pulse = 0.12 + (tail * 0.9 + travel * 1.2) * fade;
    vec3 color = mix(vec3(0.52, 0.65, 1.0), vec3(0.92, 0.96, 1.0), travel);
    gl_FragColor = vec4(color, strength * pulse);
  }
`;
const signalVertex = `
  uniform float elapsed;
  uniform float pointSize;
  attribute float seed;
  varying float pulse;
  varying float visibility;
  void main() {
    vec3 facing = normalize(mat3(modelViewMatrix) * normalize(position));
    visibility = smoothstep(0.03, 0.2, facing.z);
    pulse = fract(elapsed / 5.0 + seed);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = pointSize * (0.9 + pulse * 0.35);
  }
`;
const signalFragment = `
  varying float pulse;
  varying float visibility;
  void main() {
    float radius = length(gl_PointCoord - vec2(0.5));
    if (radius > 0.5 || visibility < 0.01) discard;
    float core = exp(-radius * radius * 85.0);
    float glow = exp(-radius * radius * 15.0) * (0.5 + 0.2 * sin(pulse * 6.283185));
    float ring = (1.0 - smoothstep(0.02, 0.07, abs(radius - pulse * 0.43))) * (1.0 - pulse);
    gl_FragColor = vec4(vec3(0.78, 0.85, 1.0), visibility * (core + glow + ring * 0.32));
  }
`;

export function createGlobeEffects(globe: Group, scene: Scene) {
  const effects = new Group();
  const geometries: BufferGeometry[] = [];
  const materials: ShaderMaterial[] = [];
  globe.add(effects);

  connections.forEach(([from, to], index) => {
    const start = geographicLocation(...(cities[from] as [number, number]));
    const end = geographicLocation(...(cities[to] as [number, number]));
    const height = 0.035 + start.angleTo(end) * 0.055;
    const samples = Array.from({ length: 33 }, (_, step) => {
      const progress = step / 32;
      const angle = start.angleTo(end);
      return start
        .clone()
        .multiplyScalar(Math.sin((1 - progress) * angle) / Math.sin(angle))
        .add(
          end
            .clone()
            .multiplyScalar(Math.sin(progress * angle) / Math.sin(angle)),
        )
        .normalize()
        .multiplyScalar(1.009 + Math.sin(progress * Math.PI) * height);
    });
    const curve = new CatmullRomCurve3(samples);
    // Keep every connection visible, with a bright moving head and broad glow.
    for (const [radius, strength] of [
      [0.01, 0.24],
      [0.0045, 0.55],
      [0.002, 1],
    ]) {
      const geometry = new TubeGeometry(curve, 64, radius, 5, false);
      const material = new ShaderMaterial({
        uniforms: {
          elapsed: { value: 0 },
          offset: { value: Math.floor(index / 4) * 0.23 + (index % 4) * 0.028 },
          strength: { value: strength },
        },
        vertexShader: routeVertex,
        fragmentShader: routeFragment,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
      });
      geometries.push(geometry);
      materials.push(material);
      effects.add(new Mesh(geometry, material));
    }
  });

  const signalGeometry = new BufferGeometry();
  signalGeometry.setAttribute(
    "position",
    new Float32BufferAttribute(
      cities.flatMap(([lon, lat]) => geographicLocation(lon, lat).toArray()),
      3,
    ),
  );
  signalGeometry.setAttribute(
    "seed",
    new Float32BufferAttribute(
      cities.map((_, index) => index / cities.length),
      1,
    ),
  );
  const signals = new ShaderMaterial({
    uniforms: { elapsed: { value: 0 }, pointSize: { value: 12 } },
    vertexShader: signalVertex,
    fragmentShader: signalFragment,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  });
  geometries.push(signalGeometry);
  materials.push(signals);
  effects.add(new Points(signalGeometry, signals));

  // A hot, thin rim over a broad scattering shell. Both are occluded by the
  // planet; the glow falls away outward instead of becoming a solid band.
  for (const [radius, falloff, strength, color] of [
    [1.065, 65, 0.7, [0.3, 0.43, 1]],
    [1.014, 180, 1, [0.8, 0.86, 1]],
  ] as const) {
    const haloGeometry = new SphereGeometry(radius, 96, 64);
    const halo = new ShaderMaterial({
      uniforms: {
        elapsed: { value: 0 },
        radius: { value: radius },
        falloff: { value: falloff },
        strength: { value: strength },
        color: { value: color },
      },
      vertexShader: `
      varying vec3 facing;
      void main() {
        facing = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
      fragmentShader: `
      uniform float elapsed;
      uniform float radius;
      uniform float falloff;
      uniform float strength;
      uniform vec3 color;
      varying vec3 facing;
      void main() {
        vec3 normal = normalize(facing);
        float distance = radius * sqrt(max(0.0, 1.0 - normal.z * normal.z)) - 1.0;
        float scattering = exp(-max(0.0, distance) * falloff);
        float topLight = 0.6 + 0.4 * smoothstep(-0.3, 0.8, normal.y);
        float pulse = 0.97 + 0.03 * sin(elapsed * 0.62831853);
        gl_FragColor = vec4(color, scattering * topLight * pulse * strength);
      }
    `,
      side: BackSide,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    });
    geometries.push(haloGeometry);
    materials.push(halo);
    effects.add(new Mesh(haloGeometry, halo));
  }

  const starGeometry = new BufferGeometry();
  const starPositions: number[] = [];
  const starSeeds: number[] = [];
  // Deterministic, stationary stars; only their intensity changes.
  const noise = (seed: number) => {
    const value = Math.sin(seed * 127.1) * 43758.5453;
    return value - Math.floor(value);
  };
  for (let index = 1; index <= 80; index++) {
    starPositions.push(
      (noise(index) - 0.5) * 3.55,
      noise(index + 80) * 1.7 - 0.7,
      -2,
    );
    starSeeds.push(noise(index + 160));
  }
  starGeometry.setAttribute(
    "position",
    new Float32BufferAttribute(starPositions, 3),
  );
  starGeometry.setAttribute("seed", new Float32BufferAttribute(starSeeds, 1));
  const starsMaterial = new ShaderMaterial({
    uniforms: { elapsed: { value: 0 }, pointSize: { value: 3 } },
    vertexShader: `
      uniform float elapsed;
      uniform float pointSize;
      attribute float seed;
      varying float brightness;
      void main() {
        brightness = 0.55 + 0.45 * pow(0.5 + 0.5 * sin(elapsed * 1.25663706 + seed * 50.0), 3.0);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = pointSize * (0.6 + seed * 0.9);
      }
    `,
    fragmentShader: `
      varying float brightness;
      void main() {
        float radius = length(gl_PointCoord - vec2(0.5));
        if (radius > 0.5) discard;
        float glow = exp(-radius * radius * 22.0);
        gl_FragColor = vec4(vec3(0.6, 0.7, 1.0), glow * brightness * 0.75);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  });
  const stars = new Points(starGeometry, starsMaterial);
  geometries.push(starGeometry);
  materials.push(starsMaterial);
  scene.add(stars);

  return {
    update(elapsed: number) {
      materials.forEach((material) => {
        material.uniforms.elapsed.value = elapsed;
      });
    },
    resize(width: number) {
      signals.uniforms.pointSize.value = Math.max(28, width / 38);
      starsMaterial.uniforms.pointSize.value = Math.max(3, width / 270);
    },
    dispose() {
      effects.removeFromParent();
      stars.removeFromParent();
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
      effects.clear();
    },
  };
}

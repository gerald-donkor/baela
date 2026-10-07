import { gsap } from "gsap";
import {
  AdditiveBlending,
  BufferGeometry,
  Float32BufferAttribute,
  Group,
  Mesh,
  OrthographicCamera,
  Points,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  WebGLRenderer,
} from "three";
import { createCountryBorders } from "./globe-geography";
import { createGlobeEffects } from "./globe-effects";
import { createGlobeInteraction } from "./globe-interaction";
import { globeProjection } from "./globe-projection";

const surfaceVertex = `
  varying vec3 facing;
  void main() {
    facing = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const surfaceFragment = `
  uniform float elapsed;
  varying vec3 facing;
  void main() {
    vec3 viewNormal = normalize(facing);
    float rim = pow(1.0 - max(0.0, viewNormal.z), 3.0);
    float topLight = smoothstep(-0.4, 0.9, viewNormal.y);
    vec3 ocean = vec3(0.006, 0.012, 0.036);
    vec3 surface = ocean;
    vec3 blue = vec3(0.07, 0.12, 0.43) * rim * (0.45 + topLight);
    float edge = pow(1.0 - max(0.0, viewNormal.z), 10.0);
    gl_FragColor = vec4(surface + blue + vec3(0.72, 0.78, 1.0) * edge, 1.0);
  }
`;
const dotsVertex = `
  uniform float elapsed;
  uniform float pointSize;
  attribute float seed;
  varying float brightness;
  varying float visibility;
  void main() {
    vec3 facing = normalize(mat3(modelViewMatrix) * normalize(position));
    visibility = smoothstep(0.02, 0.18, facing.z);
    brightness = 0.86 + 0.14 * sin(seed * 71.0 + elapsed * 1.25663706);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = pointSize * (0.7 + 0.3 * max(0.0, facing.z));
  }
`;
const dotsFragment = `
  varying float brightness;
  varying float visibility;
  void main() {
    float radius = length(gl_PointCoord - vec2(0.5));
    if (radius > 0.5 || visibility < 0.01) discard;
    float alpha = (1.0 - smoothstep(0.20, 0.5, radius)) * visibility;
    gl_FragColor = vec4(vec3(0.62, 0.69, 1.0) * brightness, alpha);
  }
`;

export function createGlobeRenderer(canvas: HTMLCanvasElement) {
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const abort = new AbortController();
  const animation = { elapsed: 0 };
  const scene = new Scene();
  const aspect = globeProjection.width / globeProjection.height;
  const camera = new OrthographicCamera(-aspect, aspect, 1, -1, 0.1, 20);
  camera.position.z = 5;
  const globe = new Group();
  globe.position.y = -0.862;
  // Match the reference's fixed silhouette and lower-edge crop.
  globe.scale.setScalar((globeProjection.radius / globeProjection.height) * 2);
  scene.add(globe);
  let renderer: WebGLRenderer | null = null;
  let tween: gsap.core.Tween | null = null;
  let dots: ShaderMaterial | null = null;
  let ocean: ShaderMaterial | null = null;
  let effects: ReturnType<typeof createGlobeEffects> | null = null;
  let borders: ReturnType<typeof createCountryBorders> | null = null;
  const geometries: BufferGeometry[] = [];
  const materials: ShaderMaterial[] = [];
  let ready = false;
  let disposed = false;
  let inView = false;
  let previousRotationTime = 0;
  const interaction = createGlobeInteraction(
    globe,
    motion,
    () => ready && inView && !disposed && !document.hidden,
    (event) => {
      const bounds = canvas.getBoundingClientRect();
      const radius = (bounds.height * globe.scale.y) / 2;
      return {
        x: (event.clientX - bounds.left - bounds.width / 2) / radius,
        y:
          (event.clientY -
            bounds.top -
            (bounds.height * (1 - globe.position.y)) / 2) /
          radius,
      };
    },
    0.008,
  );

  const render = () => {
    if (
      !ready ||
      disposed ||
      !renderer ||
      renderer.getContext().isContextLost()
    )
      return;
    const elapsed = motion.matches ? 0 : animation.elapsed;
    const rotationTime = motion.matches ? 0 : (tween?.totalTime() ?? elapsed);
    interaction.update(
      Math.max(0, Math.min(rotationTime - previousRotationTime, 0.05)),
    );
    previousRotationTime = rotationTime;
    if (dots) dots.uniforms.elapsed.value = elapsed;
    if (ocean) ocean.uniforms.elapsed.value = elapsed;
    effects?.update(elapsed);
    renderer.render(scene, camera);
  };
  const sync = () => {
    tween?.pause();
    interaction.sync();
    if (!ready || disposed) return;
    render();
    if (!motion.matches && inView && !document.hidden) tween?.resume();
  };
  const resize = () => {
    if (!renderer || disposed) return;
    // Bound GPU work independently of retina/mobile display density.
    const width = Math.min(
      1920,
      Math.round(canvas.clientWidth * Math.min(devicePixelRatio, 2)),
    );
    renderer.setSize(
      Math.max(1, width),
      Math.max(1, Math.round(width / aspect)),
      false,
    );
    if (dots) dots.uniforms.pointSize.value = Math.max(2.8, width / 360);
    effects?.resize(width);
    render();
  };
  const observer = new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    sync();
  });
  const resizeObserver = new ResizeObserver(resize);
  observer.observe(canvas);
  resizeObserver.observe(canvas);
  document.addEventListener("visibilitychange", sync);
  motion.addEventListener("change", sync);
  const contextLost = (event: Event) => {
    event.preventDefault();
    ready = false;
    tween?.pause();
    canvas.dataset.ready = "false";
  };
  canvas.addEventListener("webglcontextlost", contextLost);

  const initialize = async () => {
    try {
      const [landResponse, borderResponse] = await Promise.all([
        fetch("/images/landing/land-points.json", { signal: abort.signal }),
        fetch("/images/landing/country-borders.json", { signal: abort.signal }),
      ]);
      if (!landResponse.ok || !borderResponse.ok)
        throw new Error("Globe geography unavailable");
      const [land, rings] = await Promise.all([
        landResponse.json() as Promise<[number, number][]>,
        borderResponse.json() as Promise<[number, number][][]>,
      ]);
      if (disposed) return;
      const context = canvas.getContext("webgl2", {
        alpha: true,
        antialias: true,
        powerPreference: "low-power",
      });
      if (!context) {
        return;
      }
      renderer = new WebGLRenderer({
        canvas,
        context,
        alpha: true,
        antialias: true,
      });
      renderer.setClearColor(0x000000, 0);
      const surface = new SphereGeometry(1, 96, 64);
      ocean = new ShaderMaterial({
        uniforms: { elapsed: { value: 0 } },
        vertexShader: surfaceVertex,
        fragmentShader: surfaceFragment,
      });
      geometries.push(surface);
      materials.push(ocean);
      globe.add(new Mesh(surface, ocean));
      const positions: number[] = [];
      const seeds: number[] = [];
      land.forEach(([lon, lat], index) => {
        const longitude = (lon * Math.PI) / 180;
        const latitude = (lat * Math.PI) / 180;
        const ring = Math.cos(latitude) * 1.002;
        positions.push(
          ring * Math.sin(longitude),
          Math.sin(latitude) * 1.002,
          ring * Math.cos(longitude),
        );
        seeds.push(index / land.length);
      });
      const continents = new BufferGeometry();
      continents.setAttribute(
        "position",
        new Float32BufferAttribute(positions, 3),
      );
      continents.setAttribute("seed", new Float32BufferAttribute(seeds, 1));
      dots = new ShaderMaterial({
        uniforms: { elapsed: { value: 0 }, pointSize: { value: 3 } },
        vertexShader: dotsVertex,
        fragmentShader: dotsFragment,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
      });
      geometries.push(continents);
      materials.push(dots);
      globe.add(new Points(continents, dots));
      borders = createCountryBorders(globe, rings);
      effects = createGlobeEffects(globe, scene);
      ready = true;
      tween = gsap.to(animation, {
        elapsed: 10,
        duration: 10,
        ease: "none",
        paused: true,
        repeat: -1,
        onUpdate: render,
      });
      resize();
      canvas.dataset.ready = "true";
      sync();
    } catch {
      if (disposed) return;
      ready = false;
      canvas.dataset.ready = "false";
    }
  };
  void initialize();
  return {
    dispose() {
      disposed = true;
      abort.abort();
      tween?.kill();
      interaction.dispose();
      observer.disconnect();
      resizeObserver.disconnect();
      motion.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", sync);
      canvas.removeEventListener("webglcontextlost", contextLost);
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
      effects?.dispose();
      borders?.dispose();
      renderer?.dispose();
      scene.clear();
      canvas.dataset.ready = "false";
    },
  };
}

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
  Texture,
  TextureLoader,
  WebGLRenderer,
} from "three";
import { createGlobeEffects } from "./globe-effects";
import { globeProjection } from "./globe-projection";

const surfaceVertex = `
  varying vec3 facing;
  varying vec3 localNormal;
  void main() {
    localNormal = normal;
    facing = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const surfaceFragment = `
  uniform float elapsed;
  uniform sampler2D artwork;
  varying vec3 facing;
  varying vec3 localNormal;
  void main() {
    vec3 viewNormal = normalize(facing);
    vec3 local = normalize(localNormal);
    float rim = pow(1.0 - max(0.0, viewNormal.z), 3.0);
    float topLight = smoothstep(-0.4, 0.9, viewNormal.y);
    vec3 ocean = vec3(0.006, 0.012, 0.036);
    vec2 sourceUV = vec2(0.5 + local.x * 0.43, 0.069 + local.y * 0.76403826);
    vec3 detail = texture2D(artwork, clamp(sourceUV, 0.001, 0.999)).rgb;
    // Lift the luminous dots and surface detail without brightening the ocean.
    detail *= 1.0 + 0.32 * smoothstep(0.08, 0.5, max(detail.r, max(detail.g, detail.b)));
    // Suppress the photographed rim: atmospheric lighting belongs to the
    // camera-facing silhouette, while the continents rotate with the surface.
    float coverage = smoothstep(0.16, 0.42, local.z) * smoothstep(-0.09, 0.0, local.y);
    float shimmer = 0.97 + 0.03 * sin(elapsed * 1.25663706 + local.x * 13.0 + local.y * 9.0);
    vec3 surface = mix(ocean, detail * shimmer, coverage);
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
    vec3 local = normalize(position);
    float photographic = smoothstep(-0.2, 0.0, local.z) * smoothstep(-0.12, -0.09, local.y);
    visibility = smoothstep(0.02, 0.18, facing.z) * (1.0 - photographic);
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
  let artwork: Texture | null = null;
  const geometries: BufferGeometry[] = [];
  const materials: ShaderMaterial[] = [];
  let ready = false;
  let disposed = false;
  let inView = false;

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
    globe.rotation.y = rotationTime * 0.008;
    if (dots) dots.uniforms.elapsed.value = elapsed;
    if (ocean) ocean.uniforms.elapsed.value = elapsed;
    effects?.update(elapsed);
    renderer.render(scene, camera);
  };
  const sync = () => {
    tween?.pause();
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
      // Preserve the reference's surface detail on the reconstructed front
      // hemisphere; full geographic coordinates continue around the back.
      const response = await fetch("/images/landing/land-points.json", {
        signal: abort.signal,
      });
      if (!response.ok) throw new Error("Globe data unavailable");
      const land = (await response.json()) as [number, number][];
      if (disposed) return;
      const texture = await new TextureLoader().loadAsync(
        "/images/landing/globe.png",
      );
      if (disposed) {
        texture.dispose();
        return;
      }
      artwork = texture;
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
        uniforms: { elapsed: { value: 0 }, artwork: { value: artwork } },
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
      observer.disconnect();
      resizeObserver.disconnect();
      motion.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", sync);
      canvas.removeEventListener("webglcontextlost", contextLost);
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
      effects?.dispose();
      artwork?.dispose();
      renderer?.dispose();
      scene.clear();
      canvas.dataset.ready = "false";
    },
  };
}

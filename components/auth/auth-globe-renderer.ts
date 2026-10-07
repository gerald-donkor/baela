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
  Vector2,
  WebGLRenderer,
} from "three";
import { createCountryBorders } from "@/components/landing/globe-geography";
import { createGlobeInteraction } from "@/components/landing/globe-interaction";
import { createGlobeEffects } from "@/components/landing/globe-effects";

// Reuse the hero's geography, atmospheric shells, and illuminated connections,
// with a complete sphere for authentication.
export function createAuthGlobeRenderer(canvas: HTMLCanvasElement) {
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const abort = new AbortController();
  const scene = new Scene();
  const camera = new OrthographicCamera(-1.6, 1.6, 1.24, -1.24, 0.1, 20);
  camera.position.z = 5;
  const globe = new Group();
  globe.rotation.set(0.12, -0.28, -0.12);
  scene.add(globe);
  const geometries: BufferGeometry[] = [];
  const materials: ShaderMaterial[] = [];
  let renderer: WebGLRenderer | null = null;
  let effects: ReturnType<typeof createGlobeEffects> | null = null;
  let borders: ReturnType<typeof createCountryBorders> | null = null;
  let dots: ShaderMaterial | null = null;
  let frame = 0;
  let elapsed = 0;
  let previousTime = 0;
  let ready = false;
  let disposed = false;
  let visible = false;
  const interaction = createGlobeInteraction(
    globe,
    motion,
    () => ready && visible && !disposed && !document.hidden,
    (event) => {
      const bounds = canvas.getBoundingClientRect();
      const radius = bounds.height / 2.48;
      return {
        x: (event.clientX - bounds.left - bounds.width / 2) / radius,
        y: (event.clientY - bounds.top - bounds.height / 2) / radius,
      };
    },
    0.028,
  );

  const render = () => {
    if (!renderer || !ready || disposed) return;
    if (dots) dots.uniforms.elapsed.value = elapsed;
    effects?.update(elapsed);
    renderer.render(scene, camera);
  };
  const tick = (time: number) => {
    const delta = previousTime
      ? Math.min((time - previousTime) / 1000, 0.05)
      : 0;
    elapsed += delta;
    interaction.update(delta);
    previousTime = time;
    render();
    frame = requestAnimationFrame(tick);
  };
  const sync = () => {
    cancelAnimationFrame(frame);
    previousTime = 0;
    interaction.sync();
    if (!ready || disposed) return;
    render();
    if (visible && !document.hidden && !motion.matches)
      frame = requestAnimationFrame(tick);
  };
  const resize = () => {
    if (!renderer || disposed) return;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (!width || !height) return;
    const aspect = width / height;
    camera.left = -1.24 * aspect;
    camera.right = 1.24 * aspect;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.setSize(width, height, false);
    const pixels = renderer.getDrawingBufferSize(new Vector2()).x;
    if (dots) dots.uniforms.pointSize.value = Math.max(1.7, pixels / 420);
    effects?.resize(pixels);
    render();
  };
  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
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
    cancelAnimationFrame(frame);
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
      if (!context) return;
      renderer = new WebGLRenderer({
        canvas,
        context,
        alpha: true,
        antialias: true,
      });
      renderer.setClearColor(0x000000, 0);

      const surface = new SphereGeometry(1, 64, 48);
      const ocean = new ShaderMaterial({
        vertexShader: `
          varying vec3 facing;
          void main() {
            facing = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          varying vec3 facing;
          void main() {
            vec3 normal = normalize(facing);
            float rim = pow(1.0 - max(0.0, normal.z), 3.5);
            float light = smoothstep(-0.65, 0.85, normal.y);
            vec3 ocean = mix(vec3(0.008, 0.018, 0.054), vec3(0.025, 0.047, 0.12), light);
            gl_FragColor = vec4(ocean + vec3(0.13, 0.24, 0.62) * rim * (0.4 + light), 1.0);
          }
        `,
      });
      geometries.push(surface);
      materials.push(ocean);
      globe.add(new Mesh(surface, ocean));

      const positions: number[] = [];
      land.forEach(([lon, lat]) => {
        const longitude = (lon * Math.PI) / 180;
        const latitude = (lat * Math.PI) / 180;
        const radius = Math.cos(latitude) * 1.003;
        positions.push(
          radius * Math.sin(longitude),
          Math.sin(latitude) * 1.003,
          radius * Math.cos(longitude),
        );
      });
      const continents = new BufferGeometry();
      continents.setAttribute(
        "position",
        new Float32BufferAttribute(positions, 3),
      );
      dots = new ShaderMaterial({
        uniforms: { elapsed: { value: 0 }, pointSize: { value: 2 } },
        vertexShader: `
          uniform float elapsed;
          uniform float pointSize;
          varying float visibility;
          varying float light;
          void main() {
            vec3 facing = normalize(mat3(modelViewMatrix) * normalize(position));
            visibility = smoothstep(0.0, 0.25, facing.z);
            light = 0.78 + 0.22 * sin(position.x * 21.0 + position.y * 13.0 + elapsed * 0.6);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = pointSize;
          }
        `,
        fragmentShader: `
          varying float visibility;
          varying float light;
          void main() {
            float radius = length(gl_PointCoord - vec2(0.5));
            if (radius > 0.5 || visibility < 0.01) discard;
            gl_FragColor = vec4(vec3(0.52, 0.67, 1.0) * light, (1.0 - smoothstep(0.15, 0.5, radius)) * visibility * 0.9);
          }
        `,
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
      resize();
      canvas.dataset.ready = "true";
      sync();
    } catch {
      canvas.dataset.ready = "false";
    }
  };
  void initialize();

  return {
    dispose() {
      disposed = true;
      interaction.dispose();
      abort.abort();
      cancelAnimationFrame(frame);
      observer.disconnect();
      resizeObserver.disconnect();
      document.removeEventListener("visibilitychange", sync);
      motion.removeEventListener("change", sync);
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

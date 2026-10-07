import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { Group } from "three";
import { createGlobeInteraction } from "@/components/landing/globe-interaction";

vi.mock("gsap", () => ({
  gsap: {
    to: vi.fn((angles, options) => {
      angles.x = options.x;
      angles.y = options.y;
    }),
    killTweensOf: vi.fn(),
  },
}));

class Surface extends EventTarget {
  constructor(private control = false) {
    super();
  }
  closest() {
    return this.control ? this : null;
  }
}

let documentTarget: EventTarget;
let interaction: ReturnType<typeof createGlobeInteraction>;
let globe: Group;
let active: boolean;
let motion: { matches: boolean };

beforeEach(() => {
  documentTarget = new EventTarget();
  vi.stubGlobal("document", documentTarget);
  vi.stubGlobal("window", new EventTarget());
  vi.stubGlobal("Element", Surface);
  globe = new Group();
  active = true;
  motion = { matches: false };
  interaction = createGlobeInteraction(
    globe,
    motion as MediaQueryList,
    () => active,
    ({ clientX, clientY }) => ({ x: clientX, y: clientY }),
    0.02,
  );
});

afterEach(() => {
  interaction.dispose();
  vi.unstubAllGlobals();
});

const finger = (x: number, y: number, identifier = 1) => ({
  clientX: x,
  clientY: y,
  identifier,
});

function touch(
  type: string,
  fingers: ReturnType<typeof finger>[],
  control = false,
) {
  const event = new Event(type, { cancelable: true });
  Object.defineProperties(event, {
    touches: {
      value: type === "touchend" || type === "touchcancel" ? [] : fingers,
    },
    changedTouches: { value: fingers },
    target: { value: new Surface(control) },
  });
  documentTarget.dispatchEvent(event);
  return event;
}

test("touch drag rotates both axes, follows the finger outside the globe, and ends cleanly", () => {
  const initial = globe.quaternion.clone();
  expect(touch("touchstart", [finger(0, 0)]).defaultPrevented).toBe(true);
  expect(touch("touchmove", [finger(0.3, 0.2)]).defaultPrevented).toBe(true);
  interaction.update(0);
  expect(globe.quaternion.angleTo(initial)).toBeGreaterThan(0.5);
  const moved = globe.quaternion.clone();
  touch("touchmove", [finger(1.2, 0.4)]);
  interaction.update(0);
  expect(globe.quaternion.angleTo(moved)).toBeGreaterThan(1);
  touch("touchend", [finger(1.2, 0.4)]);
  const released = globe.quaternion.clone();
  expect(touch("touchmove", [finger(0, 0)]).defaultPrevented).toBe(false);
  interaction.update(0);
  expect(globe.quaternion.angleTo(released)).toBeLessThan(1e-7);
  interaction.update(1);
  expect(globe.quaternion.angleTo(released)).toBeGreaterThan(0.01);
});

test("controls, outside starts, reduced motion and inactive globes retain native gestures", () => {
  expect(touch("touchstart", [finger(0, 0)], true).defaultPrevented).toBe(
    false,
  );
  expect(touch("touchstart", [finger(2, 0)]).defaultPrevented).toBe(false);
  motion.matches = true;
  expect(touch("touchstart", [finger(0, 0)]).defaultPrevented).toBe(false);
  motion.matches = false;
  active = false;
  expect(touch("touchstart", [finger(0, 0)]).defaultPrevented).toBe(false);
  interaction.update(0);
  expect(globe.quaternion.angleTo(new Group().quaternion)).toBe(0);
});

test("cancellation, multiple fingers and disposal stop touch tracking", () => {
  touch("touchstart", [finger(0, 0)]);
  touch("touchcancel", [finger(0, 0)]);
  expect(touch("touchmove", [finger(0.4, 0)]).defaultPrevented).toBe(false);
  touch("touchstart", [finger(0, 0)]);
  expect(
    touch("touchmove", [finger(0.4, 0), finger(0, 0, 2)]).defaultPrevented,
  ).toBe(false);
  expect(touch("touchmove", [finger(0.4, 0)]).defaultPrevented).toBe(false);
  interaction.dispose();
  expect(touch("touchstart", [finger(0, 0)]).defaultPrevented).toBe(false);
});

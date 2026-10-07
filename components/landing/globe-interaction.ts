import { gsap } from "gsap";
import { Group, Quaternion, Vector2, Vector3 } from "three";

export function createGlobeInteraction(
  globe: Group,
  motion: MediaQueryList,
  isActive: () => boolean,
  projectPointer: (event: Pick<MouseEvent, "clientX" | "clientY">) => {
    x: number;
    y: number;
  },
  idleSpeed: number,
) {
  const initialOrientation = globe.quaternion.clone();
  const initialPosition = globe.position.clone();
  const initialScale = globe.scale.clone();
  let hovering = false;
  let resetting = false;
  let resetAnimation: gsap.core.Timeline | null = null;
  let touchId: number | null = null;
  const pointer = new Vector2();
  const target = new Vector2();
  const angles = { x: 0, y: 0 };
  const applied = new Vector2();
  const horizontalAxis = new Vector3(1, 0, 0);
  const verticalAxis = new Vector3(0, 1, 0);
  const turn = new Quaternion();

  // Observe the pointer without covering page links or forms.
  const resetPointer = () => {
    touchId = null;
    hovering = false;
    pointer.set(0, 0);
  };
  const movePointer = (x: number, y: number) => {
    if (hovering) {
      // Accumulate movement so repeated sweeps can turn through any angle.
      target.x += (y - pointer.y) * Math.PI;
      target.y += (x - pointer.x) * Math.PI;
      gsap.to(angles, {
        x: target.x,
        y: target.y,
        duration: 0.35,
        ease: "power2.out",
        overwrite: true,
      });
    }
    hovering = true;
    pointer.set(x, y);
  };
  const trackPointer = (event: PointerEvent) => {
    // Touch gestures have their own lifecycle below, including scroll control.
    if (event.pointerType === "touch" || touchId !== null) return;
    if (resetting) return;
    if (!isActive() || motion.matches) {
      resetPointer();
      return;
    }
    const { x, y } = projectPointer(event);
    if (x * x + y * y > 1) {
      resetPointer();
      return;
    }
    movePointer(x, y);
  };

  const startTouch = (event: TouchEvent) => {
    resetPointer();
    if (
      resetting ||
      !isActive() ||
      motion.matches ||
      event.touches.length !== 1
    )
      return;
    if (
      event.target instanceof Element &&
      event.target.closest(
        "a, button, input, textarea, select, [contenteditable]",
      )
    )
      return;
    const touch = event.touches[0];
    const { x, y } = projectPointer(touch);
    if (x * x + y * y > 1) return;
    // Claim only gestures starting on the globe, leaving page controls usable.
    // Cancel native panning before it can cancel the rotation gesture.
    event.preventDefault();
    touchId = touch.identifier;
    movePointer(x, y);
  };
  const moveTouch = (event: TouchEvent) => {
    if (touchId === null) return;
    if (
      resetting ||
      !isActive() ||
      motion.matches ||
      event.touches.length !== 1
    ) {
      resetPointer();
      return;
    }
    const touch = Array.from(event.touches).find(
      (touch) => touch.identifier === touchId,
    );
    if (!touch) return;
    event.preventDefault();
    const { x, y } = projectPointer(touch);
    movePointer(x, y);
  };
  const endTouch = (event: TouchEvent) => {
    if (
      Array.from(event.changedTouches).some(
        (touch) => touch.identifier === touchId,
      )
    )
      resetPointer();
  };

  const bounceAndReset = (event: MouseEvent) => {
    if (!isActive() || resetting || motion.matches) return;
    if (
      event.target instanceof Element &&
      event.target.closest("a, button, input, textarea, select")
    )
      return;
    const { x, y } = projectPointer(event);
    if (x * x + y * y > 1) return;

    resetting = true;
    gsap.killTweensOf(angles);
    const startOrientation = globe.quaternion.clone();
    const rotation = { progress: 0 };
    resetAnimation = gsap.timeline({
      onComplete: () => {
        globe.quaternion.copy(initialOrientation);
        globe.position.copy(initialPosition);
        globe.scale.copy(initialScale);
        angles.x = angles.y = 0;
        target.set(0, 0);
        applied.set(0, 0);
        resetPointer();
        resetting = false;
        resetAnimation = null;
      },
    });
    resetAnimation
      .to(globe.position, {
        y: initialPosition.y + initialScale.y * 0.14,
        duration: 0.18,
        ease: "power2.out",
      })
      .to(
        globe.scale,
        {
          x: initialScale.x * 1.06,
          y: initialScale.y * 1.06,
          z: initialScale.z * 1.06,
          duration: 0.18,
        },
        "<",
      )
      .to(globe.position, {
        y: initialPosition.y,
        duration: 0.45,
        ease: "bounce.out",
      })
      .to(
        globe.scale,
        {
          x: initialScale.x,
          y: initialScale.y,
          z: initialScale.z,
          duration: 0.45,
          ease: "bounce.out",
        },
        "<",
      )
      .to(rotation, {
        progress: 1,
        duration: 0.9,
        ease: "power2.inOut",
        onUpdate: () => {
          globe.quaternion.slerpQuaternions(
            startOrientation,
            initialOrientation,
            rotation.progress,
          );
        },
      });
  };

  const preventDoubleClickSelection = (event: MouseEvent) => {
    if (event.detail < 2 || !isActive() || motion.matches) return;
    if (
      event.target instanceof Element &&
      event.target.closest("a, button, input, textarea, select")
    )
      return;
    const { x, y } = projectPointer(event);
    if (x * x + y * y <= 1) event.preventDefault();
  };

  document.addEventListener("pointermove", trackPointer, { passive: true });
  document.addEventListener("touchstart", startTouch, { passive: false });
  document.addEventListener("touchmove", moveTouch, { passive: false });
  document.addEventListener("touchend", endTouch);
  document.addEventListener("touchcancel", endTouch);
  document.addEventListener("mousedown", preventDoubleClickSelection);
  document.addEventListener("dblclick", bounceAndReset);
  document.addEventListener("pointerleave", resetPointer);
  window.addEventListener("blur", resetPointer);
  window.addEventListener("scroll", resetPointer, { passive: true });
  return {
    update(delta: number) {
      // Rotate around screen axes to keep pointer directions consistent even
      // after crossing the poles, without limiting pitch or longitude.
      if (!resetting) {
        turn.setFromAxisAngle(horizontalAxis, angles.x - applied.x);
        globe.quaternion.premultiply(turn);
        turn.setFromAxisAngle(
          verticalAxis,
          angles.y - applied.y + (hovering ? 0 : delta * idleSpeed),
        );
        globe.quaternion.premultiply(turn).normalize();
        applied.set(angles.x, angles.y);
      }
    },
    sync() {
      if (!isActive() || motion.matches) resetPointer();
      if (motion.matches) resetAnimation?.progress(1);
      else if (!isActive()) resetAnimation?.pause();
      else resetAnimation?.resume();
    },
    dispose() {
      gsap.killTweensOf(angles);
      resetAnimation?.kill();
      document.removeEventListener("pointermove", trackPointer);
      document.removeEventListener("touchstart", startTouch);
      document.removeEventListener("touchmove", moveTouch);
      document.removeEventListener("touchend", endTouch);
      document.removeEventListener("touchcancel", endTouch);
      document.removeEventListener("mousedown", preventDoubleClickSelection);
      document.removeEventListener("dblclick", bounceAndReset);
      document.removeEventListener("pointerleave", resetPointer);
      window.removeEventListener("blur", resetPointer);
      window.removeEventListener("scroll", resetPointer);
    },
  };
}

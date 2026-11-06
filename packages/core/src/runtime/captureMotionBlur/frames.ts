/** Where each mover is across the shutter: its pose read at several times, then tapped. */

import type { MoverFrame } from "./composite";
import {
  type Affine,
  type createPoseReader,
  IDENTITY,
  autoTaps,
  tapsFromReads,
  translate,
} from "./pose";

export const CONTENT_NODE_LIMIT = 256;

type Box = [number, number, number, number];

const SUBPIXEL = 0.5;

export const within = (r: DOMRect, o: DOMRect): boolean =>
  r.left >= o.left - SUBPIXEL &&
  r.top >= o.top - SUBPIXEL &&
  r.right <= o.right + SUBPIXEL &&
  r.bottom <= o.bottom + SUBPIXEL;

export function holdsFixedChild(el: HTMLElement): boolean {
  const walker = el.ownerDocument.createTreeWalker(el, NodeFilter.SHOW_ELEMENT);
  for (let n = 0; n < CONTENT_NODE_LIMIT && walker.nextNode(); n++) {
    if (getComputedStyle(walker.currentNode as Element).position === "fixed") return true;
  }
  return false;
}

const POSITIONED = new Set(["absolute", "fixed"]);
const NO_CONTENT = new Set(["none", "normal"]);

export function pseudoBox(el: HTMLElement, which: "::before" | "::after"): Box | null {
  const cs = getComputedStyle(el, which);
  if (NO_CONTENT.has(cs.content) || !POSITIONED.has(cs.position)) return null;
  const left = parseFloat(cs.left) + el.clientLeft;
  const top = parseFloat(cs.top) + el.clientTop;
  const width = parseFloat(cs.width);
  const height = parseFloat(cs.height);
  if (![left, top, width, height].every(Number.isFinite)) return null;
  return [left, top, left + width, top + height];
}

export interface FrameRequest {
  movers: HTMLElement[];
  reader: ReturnType<typeof createPoseReader>;
  seek: (t: number) => void;
  restore?: (t: number) => void;
  t: number;
  /** Pose reads across the shutter; the taps between them are interpolated. */
  reads: number;
  shutterSeconds: number;
  phaseSeconds: number;
  /** A fixed tap count, or null to size the taps to each smear. */
  taps: number | null;
  /** Px each mover's box grows by on every side (its glow); none for a mover not listed. */
  pads?: ReadonlyMap<HTMLElement, number>;
  frameW: number;
  frameH: number;
}

export function shutterTimes(
  shutterDeg: number,
  phaseDeg: number | null,
  fps: number,
): { shutterSeconds: number; phaseSeconds: number } {
  const shutterSeconds = shutterDeg / 360 / fps;
  return {
    shutterSeconds,
    phaseSeconds: phaseDeg === null ? -shutterSeconds / 2 : phaseDeg / 360 / fps,
  };
}

export function readMoverFrames(req: FrameRequest): { els: HTMLElement[]; frames: MoverFrame[] } {
  const { reader: r, shutterSeconds: shutter, t, reads, seek } = req;
  const visible = req.movers.filter(
    (el) =>
      typeof el.checkVisibility !== "function" || el.checkVisibility({ visibilityProperty: true }),
  );
  if (visible.length === 0 || shutter <= 0) return { els: [], frames: [] };
  const start = t + req.phaseSeconds;
  const poses = visible.map((): Affine[] => []);
  for (let j = 0; j < reads; j++) {
    seek(Math.max(0, start + (j / (reads - 1)) * shutter));
    r.reset();
    visible.forEach((el, i) => poses[i]?.push(r.pose(el)));
  }
  (req.restore ?? seek)(t);
  r.reset();
  const frames = visible.map((el, i) => {
    const pad = req.pads?.get(el) ?? 0;
    const w = el.offsetWidth + 2 * pad;
    const h = el.offsetHeight + 2 * pad;
    const grow = (m: Affine): Affine => translate(m, -pad, -pad);
    const path = (poses[i] ?? [IDENTITY]).map(grow);
    return {
      w,
      h,
      now: grow(r.pose(el)),
      taps:
        req.taps === null
          ? autoTaps(path, w, h, req.frameW, req.frameH)
          : tapsFromReads(path, req.taps),
    };
  });
  r.reset();
  return { els: visible, frames };
}

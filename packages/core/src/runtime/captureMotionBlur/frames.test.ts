import { describe, expect, it } from "vitest";
import { readMoverFrames, shutterTimes } from "./frames";
import { createPoseReader } from "./pose";

/** The times a frame's pose reads land on, for a shutter of `shutterDeg` at 30 fps. */
function readTimes(t: number, shutterDeg: number, phaseDeg: number | null, reads = 8): number[] {
  const scene = document.createElement("div");
  const mover = scene.appendChild(document.createElement("div"));
  const times: number[] = [];
  readMoverFrames({
    movers: [mover],
    reader: createPoseReader(scene, new Set()),
    seek: (at) => times.push(at),
    t,
    reads,
    ...shutterTimes(shutterDeg, phaseDeg, 30),
    taps: 4,
    frameW: 100,
    frameH: 100,
  });
  return times.slice(0, reads);
}

describe("shutter phase", () => {
  it("reads exactly the times a centred shutter always read when no phase is set", () => {
    const shutter = 240 / 360 / 30;
    const expected = Array.from({ length: 8 }, (_, j) => 2 - shutter / 2 + (j / 7) * shutter);
    expect(readTimes(2, 240, null)).toEqual(expected);
  });

  it("opens at the frame at phase 0 and stays open for the shutter", () => {
    const times = readTimes(2, 180, 0);
    expect(times[0]).toBe(2);
    expect(times[times.length - 1]).toBeCloseTo(2 + 1 / 60, 10);
  });

  it("opens one whole frame late at phase 360", () => {
    expect(readTimes(2, 299, 360)[0]).toBeCloseTo(2 + 1 / 30, 10);
  });

  it("matches the centred shutter when the phase is minus half the angle", () => {
    expect(readTimes(2, 180, -90)).toEqual(readTimes(2, 180, null));
  });

  it("still never reads before the start of the timeline", () => {
    expect(readTimes(0, 180, -180)[0]).toBe(0);
  });
});

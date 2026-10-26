/**
 * Fork-only. Upstream's author-script scan (#6436) is tested against a hand-written wrapper whose
 * authored code sits between the markers as raw text. This fork's `wrapScopedCompositionScript`
 * carries the authored code in a JSON string literal instead, so this runs the scan on the real
 * wrapper output: a composition that never registers a timeline must scan as "cannot register"
 * (otherwise the render waits out the whole setup timeout), and one that does must scan as "can".
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import { parseHTML } from "linkedom";
import { wrapScopedCompositionScript } from "@hyperframes/core/compiler";
import { AUTHORED_SOURCE_BEGIN, AUTHORED_SOURCE_END } from "@hyperframes/core";
import { authorScriptsMayRegisterTimelines } from "./frameCapture.js";

const RUNTIME_ATTR = "data-hyperframes-preview-runtime";

async function scanScopedScript(source: string): Promise<boolean> {
  const wrapped = wrapScopedCompositionScript(source, "scene");
  // The wrapper is inline script text, so only `</script` inside it could end the element early.
  expect(wrapped).not.toContain("</script");
  const { document } = parseHTML(`<body><script>${wrapped}</script></body>`);
  Object.defineProperty(document, "readyState", { value: "complete" });
  vi.stubGlobal("document", document);
  vi.stubGlobal("location", new URL("http://localhost:3000/index.html"));
  return authorScriptsMayRegisterTimelines(
    RUNTIME_ATTR,
    AUTHORED_SOURCE_BEGIN,
    AUTHORED_SOURCE_END,
  );
}

describe("authorScriptsMayRegisterTimelines on this fork's scoped wrapper", () => {
  afterEach(() => {
    delete (globalThis as { __hfAuthorScan?: boolean }).__hfAuthorScan;
    vi.unstubAllGlobals();
  });

  it("is false for authored code that never touches __timelines, though the wrapper itself does", async () => {
    expect(wrapScopedCompositionScript("draw();", "scene")).toContain("__timelines");
    expect(await scanScopedScript("const ctx = canvas.getContext('2d'); draw(ctx);")).toBe(false);
  });

  it("is true when the authored code registers a timeline, with quotes and angle brackets in it", async () => {
    expect(
      await scanScopedScript(`if (1 < 2) window.__timelines["scene"] = gsap.timeline();`),
    ).toBe(true);
  });

  it("is true when the authored code imports another file dynamically", async () => {
    expect(await scanScopedScript(`import("./scene.js").then((m) => m.run());`)).toBe(true);
  });
});

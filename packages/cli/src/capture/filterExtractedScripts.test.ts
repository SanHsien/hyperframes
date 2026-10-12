import { describe, expect, it } from "vitest";
import { filterExtractedScripts } from "./filterExtractedScripts.js";

describe("filterExtractedScripts", () => {
  it("removes framework scripts while preserving surrounding markup", () => {
    const result = filterExtractedScripts(
      "<main><h1>Welcome</h1><script>self.__next_f.push([])</script></main>",
      '<style>body{color:red}</style><script src="/_next/static/chunks/main.js"></script>',
    );

    expect(result.bodyHtml).toContain("<main><h1>Welcome</h1></main>");
    expect(result.headHtml).toContain("<style>body{color:red}</style>");
    expect(result.bodyHtml).not.toContain("__next_f");
    expect(result.headHtml).not.toContain("/_next/static/chunks/main.js");
  });

  it("cleans nested inert templates and hydration attributes without removing visual scripts", () => {
    const result = filterExtractedScripts(
      `<main DATA-REACTROOT='root' data-reactroot-extra="keep"><template><section data-reactroot><template><script>self.__next_f.push([])</script><script>gsap.to('.box', {x: 10})</script><div data-reactroot='nested'>React Svelte Vue</div></template></section></template><script type="module">mountSvelte(); createApp();</script></main>`,
      `<template><script src="/_next/static/chunks/app/page.js"></script><script src="/visual.js"></script></template>`,
    );
    expect(result.bodyHtml).not.toMatch(/\bdata-reactroot(?:=|>|\s)/i);
    expect(result.bodyHtml).not.toContain("__next_f");
    expect(result.bodyHtml).toContain('data-reactroot-extra="keep"');
    expect(result.bodyHtml).toContain("gsap.to");
    expect(result.bodyHtml).toContain("mountSvelte(); createApp();");
    expect(result.bodyHtml).toContain("React Svelte Vue");
    expect(result.headHtml).not.toContain("/_next/");
    expect(result.headHtml).toContain("/visual.js");
  });

  it("repairs malformed markup and preserves marker-like literal script content", () => {
    const result = filterExtractedScripts(
      `<div data-reactroot='x'><template><p data-reactroot><script id="__NEXT_DATA__">{}</script><script>const label = 'data-reactroot';</script>`,
      `<script src="/react-visual.js"></script>`,
    );
    expect(result.bodyHtml).not.toContain("__NEXT_DATA__");
    expect(result.bodyHtml).not.toContain('data-reactroot="');
    expect(result.bodyHtml).toContain("const label = 'data-reactroot';");
    expect(result.headHtml).toContain("/react-visual.js");
  });

  it("cleans sixteen template levels and rejects deeper input instead of bypassing cleanup", () => {
    const nested = (depth: number) =>
      "<template>".repeat(depth) +
      `<div data-reactroot><script>__next_f.push([])</script><script>animate()</script></div>` +
      "</template>".repeat(depth);
    expect(filterExtractedScripts(nested(16), "").bodyHtml).not.toContain("__next_f");
    expect(filterExtractedScripts(nested(16), "").bodyHtml).toContain("animate()");
    expect(() => filterExtractedScripts(nested(17), "")).toThrow("template nesting exceeds 16");
  });

  it("preserves the distinct head and body script policies and cannot lose markup to a wrapper id", () => {
    const result = filterExtractedScripts(
      `<div id="__hf_root"></div><script src="/_next/static/chunks/main.js"></script><script>animate()</script>`,
      `<script>self.__next_f.push([])</script><script type="application/json">{"framework":"Vue"}</script>`,
    );
    expect(result.bodyHtml).toContain("/_next/static/chunks/main.js");
    expect(result.bodyHtml).toContain("animate()");
    expect(result.headHtml).toContain("self.__next_f.push([])");
    expect(result.headHtml).toContain('{"framework":"Vue"}');
  });

  it("walks wide sibling sets without spreading them into function arguments", () => {
    const result = filterExtractedScripts(
      "<section>" + "<div data-reactroot>visual</div>".repeat(10_000) + "</section>",
      "",
    );
    expect(result.bodyHtml).not.toContain("data-reactroot");
    expect(result.bodyHtml.match(/visual/g)).toHaveLength(10_000);
  });
});

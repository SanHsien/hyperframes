import { describe, expect, it } from "vitest";
import { stripFrameworkMarkup } from "./frameworkMarkup.js";

describe("stripFrameworkMarkup", () => {
  it("removes mixed-case framework scripts and hydration markers", () => {
    const result = stripFrameworkMarkup(
      `<main DATA-REACTROOT=""><SCRIPT id="__NEXT_DATA__">{}</SCRIPT ><script>self.__next_f.push([])</script><script>visual()</script></main>`,
      `<SCRIPT src="/_next/static/chunks/main.js"></SCRIPT ><script src="https://cdn.example/gsap.js"></script>`,
    );

    expect(result.bodyHtml).not.toContain("__NEXT_DATA__");
    expect(result.bodyHtml).not.toContain("__next_f");
    expect(result.bodyHtml).not.toContain("data-reactroot");
    expect(result.bodyHtml).toContain("visual()");
    expect(result.headHtml).not.toContain("/_next/");
    expect(result.headHtml).toContain("https://cdn.example/gsap.js");
  });

  it("cleans framework nodes inside inert templates", () => {
    const result = stripFrameworkMarkup(
      `<template><section data-reactroot><script>self.__next_f.push([])</script><p>keep</p></section></template>`,
      "",
    );

    expect(result.bodyHtml).not.toContain("__next_f");
    expect(result.bodyHtml).not.toContain("data-reactroot");
    expect(result.bodyHtml).toContain("<p>keep</p>");
  });
});

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
    // Applies to the files that opt into happy-dom with `@vitest-environment`. happy-dom 21 turns
    // iframe page loading off by default; iframe.sync.test.ts reads iframe.contentDocument.
    environmentOptions: {
      happyDOM: { settings: { enableIframePageLoading: true } },
    },
  },
});

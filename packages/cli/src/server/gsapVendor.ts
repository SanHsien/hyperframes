import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { GSAP_CDN_VERSION } from "@hyperframes/core/gsap-cdn";
import { readBundleFile } from "./readBundleFile.js";

const moduleDir = dirname(fileURLToPath(import.meta.url));

function installedGsapDist(): string | null {
  try {
    const coreRequire = createRequire(resolve(moduleDir, "..", "..", "..", "core", "package.json"));
    return join(dirname(coreRequire.resolve("gsap/package.json")), "dist");
  } catch {
    return null;
  }
}

/** Resolve the CLI's matching GSAP dist in a packaged or source checkout. */
export function resolveGsapVendorDir(): string | null {
  const vendored = join("vendor", "npm", `gsap@${GSAP_CDN_VERSION}`, "dist");
  const candidates = [
    resolve(moduleDir, vendored),
    resolve(moduleDir, "..", "..", "dist", vendored),
    installedGsapDist(),
  ];
  for (const dir of candidates) {
    if (!dir || !existsSync(join(dir, "gsap.min.js"))) continue;
    const manifest = readBundleFile(join(dir, "..", "package.json"));
    if (manifest && JSON.parse(manifest.toString("utf-8")).version !== GSAP_CDN_VERSION) continue;
    return dir;
  }
  return null;
}

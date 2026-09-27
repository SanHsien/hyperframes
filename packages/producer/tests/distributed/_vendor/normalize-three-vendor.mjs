import { readFileSync, writeFileSync } from "node:fs";

const file = process.argv[2];
if (!file) throw new Error("Usage: node normalize-three-vendor.mjs <bundle>");

const normalized = readFileSync(file, "utf8")
  .replace(/\r\n?/g, "\n")
  .split("\n")
  .map((line) => line.replace(/[ \t]+$/, "").replace(/^ +(?=\t)/, ""))
  .join("\n");

writeFileSync(file, normalized);

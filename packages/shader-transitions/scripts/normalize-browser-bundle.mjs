import { readFileSync, writeFileSync } from "node:fs";

const files = process.argv.slice(2);
if (files.length === 0) {
  throw new Error("Usage: node normalize-browser-bundle.mjs <bundle> [...bundle]");
}

for (const file of files) {
  const normalized = readFileSync(file, "utf8")
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/, ""))
    .join("\n");

  writeFileSync(file, normalized);
}

import { readFileSync } from "node:fs";

const MAX_LINES = 600;
const isExempt = (file) => /\.test\.(?:ts|tsx)$|\.generated\./.test(file);

let failed = false;
for (const file of process.argv.slice(2)) {
  if (isExempt(file)) continue;

  const source = readFileSync(file, "utf8");
  const lineCount = source.match(/\n/g)?.length ?? 0;
  if (lineCount <= MAX_LINES) continue;

  console.error(`ERROR: ${file} has ${lineCount} lines (max ${MAX_LINES})`);
  failed = true;
}

if (failed) process.exitCode = 1;

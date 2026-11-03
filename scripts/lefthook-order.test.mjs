import assert from "node:assert/strict";
import { cpSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";

const config = parse(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "lefthook.yml"), "utf8"),
);
const jobs = config["pre-commit"].jobs ?? [];

test("the skills manifest is hashed after the formatter has rewritten the skills", () => {
  const group = jobs.find((job) => job.group?.jobs?.some((j) => j.name === "skills-manifest"));
  assert.ok(group, "skills-manifest must sit in a group, not run beside the formatter");
  assert.equal(group.group.piped, true, "the group must run its jobs in order");
  const names = group.group.jobs.map((j) => j.name);
  assert.ok(names.includes("format"), "the group must hold the formatter");
  assert.ok(names.indexOf("format") < names.indexOf("skills-manifest"));
});

test("typecheck works with only a hoisted compiler and rejects errors in every project", () => {
  const job = jobs.find((job) => job.name === "typecheck");
  assert.ok(job, "pre-commit must retain its typecheck job");
  assert.equal(job.glob, "*.{ts,tsx}");
  const repo = dirname(dirname(fileURLToPath(import.meta.url)));
  mkdirSync(join(repo, "tmp"), { recursive: true });
  const fixture = mkdtempSync(join(repo, "tmp", "lefthook-typecheck-"));
  const projects = ["packages/core", "packages/studio", "scripts"];
  try {
    // Install only the real root compiler, with no package-local node_modules.
    cpSync(join(repo, "node_modules", "typescript"), join(fixture, "node_modules", "typescript"), {
      recursive: true,
    });
    for (const project of projects) {
      const dir = join(fixture, project);
      mkdirSync(dir, { recursive: true });
      writeFileSync(
        join(dir, "tsconfig.json"),
        JSON.stringify({ compilerOptions: { types: [] }, files: ["input.ts"] }),
      );
      writeFileSync(join(dir, "input.ts"), "const value: number = 1;\n");
    }
    const run = () =>
      spawnSync(job.run, {
        cwd: fixture,
        shell: true,
        encoding: "utf8",
        timeout: 120_000,
      });
    const clean = run();
    assert.equal(clean.status, 0, clean.error?.message ?? clean.stdout + clean.stderr);
    for (const project of projects) {
      const source = join(fixture, project, "input.ts");
      writeFileSync(source, 'const value: number = "invalid";\n');
      const invalid = run();
      assert.notEqual(invalid.status, 0, `${project} type errors must block a commit`);
      assert.match(invalid.stdout + invalid.stderr, /TS2322/);
      writeFileSync(source, "const value: number = 1;\n");
    }
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
});

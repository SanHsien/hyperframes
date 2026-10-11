import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { test } from "node:test";
import { parse } from "yaml";

const workflow = parse(
  readFileSync(new URL("../.github/workflows/studio-drag-frames.yml", import.meta.url), "utf8"),
);
const job = workflow.jobs["drag-frames"];

test("PR drag runs checkout their exact head; dispatch keeps an explicit ref", () => {
  assert.equal(
    job.env.BENCH_REF,
    "${{ github.event_name == 'pull_request' && github.event.pull_request.head.sha || inputs.ref || github.sha }}",
  );
  assert.equal(job.steps[0].with.ref, "${{ env.BENCH_REF }}");
  assert.deepEqual(job.strategy.matrix.run, [1, 2, 3, 4, 5]);
  assert.ok(
    existsSync(new URL("../packages/studio/tests/e2e/edit-accuracy/run.mjs", import.meta.url)),
  );
});

test("drag assertions and quiet-box gate remain mandatory", () => {
  assert.match(
    job.steps.find((step) => step.name === "Run the drag cases").run,
    /set -euo pipefail/,
  );
  assert.match(
    job.steps.find((step) => step.name?.startsWith("Require a quiet box")).run,
    /process\.exit\(1\)/,
  );
  assert.equal(job.steps.at(-1).with["if-no-files-found"], "error");
  assert.equal(workflow.permissions.contents, "read");
});

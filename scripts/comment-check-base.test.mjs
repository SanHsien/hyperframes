import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { ADOPTION, commentCheckBase, selectCommentBase } from "./comment-check-base.mjs";

const head = "b".repeat(40);
const event = () => ({
  number: 2,
  pull_request: {
    base: { sha: ADOPTION.base },
    head: { sha: head, ref: ADOPTION.branch, repo: { full_name: ADOPTION.owner } },
  },
});

test("only the exact reviewed adoption PR uses its fixed ancestor baseline", () => {
  const calls = [];
  assert.equal(
    selectCommentBase(event(), ADOPTION.owner, head, (from, to) => {
      calls.push([from, to]);
      return true;
    }),
    ADOPTION.baseline,
  );
  assert.deepEqual(calls, [
    [ADOPTION.reviewedHead, head],
    [ADOPTION.baseline, ADOPTION.reviewedHead],
  ]);
});

test("other owner, PR, branch, base or head repository keeps its PR base", () => {
  const mutations = [
    (value) => value.number++,
    (value) => (value.pull_request.head.ref = "ordinary-fix"),
    (value) => (value.pull_request.base.sha = "c".repeat(40)),
    (value) => (value.pull_request.head.repo.full_name = "other/hyperframes"),
  ];
  for (const mutate of mutations) {
    const value = event();
    mutate(value);
    assert.equal(
      selectCommentBase(value, ADOPTION.owner, head, () => {
        throw Error("unexpected exemption");
      }),
      value.pull_request.base.sha,
    );
  }
  assert.equal(
    selectCommentBase(event(), "heygen-com/hyperframes", head, () => false),
    ADOPTION.base,
  );
});

test("stale checkout, malformed base or rewritten adoption ancestry fails closed", () => {
  assert.throws(
    () => selectCommentBase(event(), ADOPTION.owner, "c".repeat(40), () => true),
    /exact checkout/,
  );
  const bad = event();
  bad.pull_request.base.sha = "HEAD";
  assert.throws(() => selectCommentBase(bad, ADOPTION.owner, head, () => true), /exact checkout/);
  for (const failing of [ADOPTION.reviewedHead, ADOPTION.baseline]) {
    assert.throws(
      () => selectCommentBase(event(), ADOPTION.owner, head, (from) => from !== failing),
      /adoption history/,
    );
  }
});

test("a normal PR still rejects added comments even with COMMENT_CHECK_BASE=HEAD", (t) => {
  const root = mkdtempSync(path.join(tmpdir(), "comments-normal-pr-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const git = (...args) => execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
  git("init", "-q");
  git("config", "user.name", "fixture");
  git("config", "user.email", "fixture@example.invalid");
  const source = path.join(root, "packages/web/src/a.ts");
  mkdirSync(path.dirname(source), { recursive: true });
  writeFileSync(source, "export const a = 1;\n");
  git("add", ".");
  git("commit", "-qm", "base");
  const base = git("rev-parse", "HEAD");
  writeFileSync(source, "// One extra comment\nexport const a = 1;\n");
  git("add", ".");
  git("commit", "-qm", "head");
  const actualHead = git("rev-parse", "HEAD");
  const payload = path.join(root, "event.json");
  writeFileSync(
    payload,
    JSON.stringify({
      number: 3,
      pull_request: {
        base: { sha: base },
        head: { sha: actualHead, ref: "ordinary-fix", repo: { full_name: ADOPTION.owner } },
      },
    }),
  );
  const env = {
    ...process.env,
    GITHUB_ACTIONS: "true",
    GITHUB_EVENT_NAME: "pull_request",
    GITHUB_EVENT_PATH: payload,
    GITHUB_REPOSITORY: ADOPTION.owner,
    COMMENT_CHECK_BASE: "HEAD",
  };
  assert.equal(commentCheckBase(root, env), base);
  const result = spawnSync(
    process.execPath,
    [fileURLToPath(new URL("./comment-ratchet.mjs", import.meta.url))],
    { cwd: root, env, encoding: "utf8" },
  );
  assert.equal(result.status, 1, result.stdout + result.stderr);
  assert.match(result.stderr, /RAISED comment share/);
});

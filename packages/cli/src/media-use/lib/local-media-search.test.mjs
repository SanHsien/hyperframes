import { strict as assert } from "node:assert";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { test } from "node:test";
import {
  installMediaVectors,
  mediaVectorRows,
  resolveBundledMediaFile,
  searchLocalSfxIndex,
} from "./local-media-search.mjs";

const REPO_ROOT = resolve(import.meta.dirname, "..", "..", "..", "..", "..");
const BUNDLED = join(REPO_ROOT, "registry", "catalog-artifact");

function scratch(t, label) {
  const dir = mkdtempSync(join(tmpdir(), `media-use-${label}-`));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}

// A source directory whose metadata is the bundled pair with `mutate` applied to the parsed JSON.
function tamperedSource(t, mutate) {
  const dir = scratch(t, "tampered-src");
  const meta = JSON.parse(readFileSync(join(BUNDLED, "media-vectors.json"), "utf8"));
  mutate(meta);
  writeFileSync(join(dir, "media-vectors.json"), JSON.stringify(meta));
  writeFileSync(join(dir, "media-vectors.bin"), readFileSync(join(BUNDLED, "media-vectors.bin")));
  return dir;
}

function forbidFetch(t) {
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url) => {
    calls.push(String(url));
    throw new Error("network is forbidden in this test");
  });
  return calls;
}

test("installs the bundled media vectors without touching the network", (t) => {
  const fetchCalls = forbidFetch(t);
  const target = scratch(t, "cache");
  assert.equal(installMediaVectors({ directory: target }), true);
  assert.ok(existsSync(join(target, "media-vectors.json")));
  assert.ok(existsSync(join(target, "media-vectors.bin")));
  if (process.platform !== "win32") {
    assert.equal(statSync(join(target, "media-vectors.json")).mode & 0o777, 0o600);
    assert.equal(statSync(join(target, "media-vectors.bin")).mode & 0o777, 0o600);
  }
  assert.ok(mediaVectorRows(target).some((row) => row.kind === "sfx"));
  assert.deepEqual(fetchCalls, []);
});

test("refuses a pair whose matrix size disagrees with its names", (t) => {
  const target = scratch(t, "cache");
  const source = tamperedSource(t, (meta) => meta.names.pop());
  assert.equal(installMediaVectors({ directory: target, sourceDirectory: source }), false);
  assert.equal(existsSync(join(target, "media-vectors.json")), false);
  assert.equal(existsSync(join(target, "media-vectors.bin")), false);
});

test("refuses rows that are not valid media vector rows", (t) => {
  const target = scratch(t, "cache");
  const source = tamperedSource(t, (meta) => {
    meta.rows[0].tags = "sfx";
  });
  assert.equal(installMediaVectors({ directory: target, sourceDirectory: source }), false);
});

test("refuses a pair with an absolute row file", (t) => {
  const target = scratch(t, "cache");
  const source = tamperedSource(t, (meta) => {
    meta.rows[0].file = "C:/Users/victim/.ssh/id_rsa";
  });
  assert.equal(installMediaVectors({ directory: target, sourceDirectory: source }), false);
  assert.equal(existsSync(join(target, "media-vectors.json")), false);
});

test("refuses a pair with a parent-traversal row file", (t) => {
  const target = scratch(t, "cache");
  const source = tamperedSource(t, (meta) => {
    meta.rows[0].file = "skills/../../../secret.txt";
  });
  assert.equal(installMediaVectors({ directory: target, sourceDirectory: source }), false);
});

test("returns false when the bundled pair is missing", (t) => {
  const target = scratch(t, "cache");
  const empty = scratch(t, "empty-src");
  assert.equal(installMediaVectors({ directory: target, sourceDirectory: empty }), false);
});

test("an absolute row file is rejected even when the file exists", (t) => {
  const root = scratch(t, "root");
  const outside = scratch(t, "outside");
  const secret = join(outside, "id_rsa");
  writeFileSync(secret, "secret");
  assert.equal(resolveBundledMediaFile(secret, root), null);
  assert.equal(resolveBundledMediaFile(secret.replaceAll("\\", "/"), root), null);
  assert.equal(resolveBundledMediaFile("/etc/passwd", root), null);
  assert.equal(resolveBundledMediaFile("C:secret.txt", root), null);
});

test("a .. row file is rejected even when it lands on an existing file", (t) => {
  const base = scratch(t, "base");
  const root = join(base, "root");
  mkdirSync(root);
  writeFileSync(join(base, "secret.txt"), "secret");
  assert.equal(resolveBundledMediaFile("../secret.txt", root), null);
  assert.equal(resolveBundledMediaFile("sfx/../../secret.txt", root), null);
  assert.equal(resolveBundledMediaFile("sfx\\..\\..\\secret.txt", root), null);
});

test("a relative row file inside the root resolves, and a missing one does not", (t) => {
  const root = scratch(t, "root");
  mkdirSync(join(root, "skills", "media-use"), { recursive: true });
  writeFileSync(join(root, "skills", "media-use", "chime.mp3"), "x");
  assert.equal(
    resolveBundledMediaFile("skills/media-use/chime.mp3", root),
    join(root, "skills", "media-use", "chime.mp3"),
  );
  assert.equal(resolveBundledMediaFile("skills/media-use/gone.mp3", root), null);
  assert.equal(resolveBundledMediaFile("", root), null);
  assert.equal(resolveBundledMediaFile(".", root), null);
});

test("ranks the bundled SFX rows with no network and returns a contained file", async (t) => {
  const fetchCalls = forbidFetch(t);
  const target = scratch(t, "cache");
  const root = scratch(t, "root");
  const row = mediaVectorRows(BUNDLED).find((candidate) => candidate.kind === "sfx");
  assert.ok(row, "bundled artifact has an sfx row");
  mkdirSync(join(root, row.file, ".."), { recursive: true });
  writeFileSync(join(root, row.file), "audio");

  const hit = await searchLocalSfxIndex(row.title, root, { directory: target });
  assert.ok(hit, "a word match on the row title finds a row");
  assert.equal(hit.row.id, row.id);
  assert.equal(hit.tier, "words");
  assert.equal(hit.localPath, join(root, row.file));
  assert.deepEqual(fetchCalls, []);
});

test("a hit whose file is not inside the root yields no result", async (t) => {
  const target = scratch(t, "cache");
  const emptyRoot = scratch(t, "root");
  const row = mediaVectorRows(BUNDLED).find((candidate) => candidate.kind === "sfx");
  assert.equal(await searchLocalSfxIndex(row.title, emptyRoot, { directory: target }), null);
});

test("a tampered source with an absolute file never leaks a path outside the root", async (t) => {
  const target = scratch(t, "cache");
  const root = scratch(t, "root");
  const outside = scratch(t, "outside");
  const secret = join(outside, "id_rsa");
  writeFileSync(secret, "secret");
  const source = tamperedSource(t, (meta) => {
    meta.rows[0].file = secret;
  });
  const title = JSON.parse(readFileSync(join(source, "media-vectors.json"), "utf8")).rows[0].title;
  assert.equal(
    await searchLocalSfxIndex(title, root, { directory: target, sourceDirectory: source }),
    null,
  );
});

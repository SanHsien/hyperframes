import { strict as assert } from "node:assert";
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { assertRemoteMediaBytes, freezeUrl, isDirectMediaUrl } from "./freeze.mjs";

const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkAAIAAAoAAv/lxKUAAAAASUVORK5CYII=",
  "base64",
);

test("accepts direct public media URLs", () => {
  assert.equal(isDirectMediaUrl("https://cdn.example.com/clip.mp4"), true);
  assert.equal(isDirectMediaUrl("https://example.com/a/b/track.mp3"), true);
  assert.equal(isDirectMediaUrl("http://example.com/logo.svg"), false);
});

test("rejects platform pages (no yt-dlp)", () => {
  assert.equal(isDirectMediaUrl("https://www.youtube.com/watch?v=abc"), false);
  assert.equal(isDirectMediaUrl("https://youtu.be/abc"), false);
  assert.equal(isDirectMediaUrl("https://vimeo.com/12345"), false);
  assert.equal(isDirectMediaUrl("https://x.com/u/status/1"), false);
});

test("rejects non-direct / non-media URLs", () => {
  assert.equal(isDirectMediaUrl("https://example.com/page"), false, "no media extension");
  assert.equal(isDirectMediaUrl("ftp://example.com/a.mp4"), false, "non-http(s)");
  assert.equal(isDirectMediaUrl("not a url"), false);
});

test("rejects local / private hosts (SSRF guard, m11)", () => {
  for (const u of [
    "http://localhost/a.mp4",
    "http://127.0.0.1/a.mp4",
    "http://127.1.2.3/a.mp4",
    "http://0.0.0.0/a.mp4",
    "http://10.0.0.5/a.mp4",
    "http://192.168.1.1/a.mp4",
    "http://172.16.0.1/a.mp4",
    "http://172.31.255.255/a.mp4",
    "http://169.254.169.254/a.mp4", // cloud metadata endpoint
    "http://printer.local/a.mp4",
    "http://svc.internal/a.mp4",
    "http://[::1]/a.mp4",
    "http://[fe80::1]/a.mp4",
    "http://[fd00::1]/a.mp4",
  ]) {
    assert.equal(isDirectMediaUrl(u), false, `should block ${u}`);
  }
  // A public host that merely starts with similar digits is still allowed.
  assert.equal(isDirectMediaUrl("https://172.40.0.1/a.mp4"), true, "172.40 is public");
  assert.equal(isDirectMediaUrl("https://11.example.com/a.mp4"), true);
});

test("freezes response bytes through the isolated atomic publisher", async (t) => {
  const root = mkdtempSync(join(tmpdir(), "hf-freeze-publisher-"));
  const destination = join(root, "nested", "image.png");
  t.mock.method(globalThis, "fetch", async () => new Response(PNG));
  try {
    assert.equal(await freezeUrl("https://cdn.example/image.png", destination), PNG.length);
    assert.deepEqual(readFileSync(destination), PNG);
    assert.deepEqual(readdirSync(join(root, "nested")), ["image.png"]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("failed remote publication leaves an unsafe destination untouched", async (t) => {
  const root = mkdtempSync(join(tmpdir(), "hf-freeze-publisher-"));
  const destination = join(root, "image.png");
  mkdirSync(destination);
  writeFileSync(join(destination, "keep"), "reservation");
  t.mock.method(globalThis, "fetch", async () => new Response(PNG));
  try {
    await assert.rejects(freezeUrl("https://cdn.example/image.png", destination), /regular file/);
    assert.equal(readFileSync(join(destination, "keep"), "utf8"), "reservation");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("rejects HTML or active SVG masquerading as media before publication", () => {
  assert.throws(
    () => assertRemoteMediaBytes(Buffer.from("<html>not video</html>"), "clip.mp4"),
    /do not match \.mp4/,
  );
  assert.throws(
    () =>
      assertRemoteMediaBytes(
        Buffer.from('<svg><a href="java&#x73;cript:alert(1)">x</a></svg>'),
        "icon.svg",
      ),
    /remote SVG is not accepted/,
  );
});

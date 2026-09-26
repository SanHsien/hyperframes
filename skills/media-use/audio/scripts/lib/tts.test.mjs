import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { chmodSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import {
  parseFfmpegDurationBanner,
  ffprobeDuration,
  resolveVoiceId,
  synthesizeOne,
  synthesizeHeygen,
  synthResult,
  transcodeAudio,
} from "./tts.mjs";

test("resolveVoiceId keeps HeyGen defaults deterministic", async () => {
  assert.equal(
    await resolveVoiceId({ provider: "heygen", lang: "en" }),
    "05f19352e8f74b0392a8f411eba40de1",
  );
  assert.equal(
    await resolveVoiceId({ provider: "heygen", lang: "es", userVoice: "voice-es" }),
    "voice-es",
  );
  await assert.rejects(
    resolveVoiceId({ provider: "heygen", lang: "es" }),
    /non-English needs an explicit --voice/,
  );
});

test("parseFfmpegDurationBanner reads ffmpeg's stderr Duration line", () => {
  const stderr = [
    "ffmpeg version 6.0",
    "Input #0, wav, from 'a.wav':",
    "  Duration: 00:00:03.42, bitrate: 705 kb/s",
    "At least one output file must be specified",
  ].join("\n");
  assert.equal(parseFfmpegDurationBanner(stderr), 3.42);
});

test("parseFfmpegDurationBanner handles an hours component", () => {
  const stderr = "  Duration: 01:02:03.50, start: 0.000000, bitrate: 128 kb/s";
  assert.equal(parseFfmpegDurationBanner(stderr), 3723.5);
});

test("parseFfmpegDurationBanner returns NaN when there is no Duration line", () => {
  assert.ok(Number.isNaN(parseFfmpegDurationBanner("ffmpeg: command not found")));
  assert.ok(Number.isNaN(parseFfmpegDurationBanner("")));
  assert.ok(Number.isNaN(parseFfmpegDurationBanner(undefined)));
});

// Regression for the actual bug: ffprobeDuration used to collapse "ffprobe
// binary is missing" (ENOENT — the "essentials"-style Windows ffmpeg build
// with no ffprobe.exe) and "file is genuinely unreadable" into the same NaN,
// giving audio.mjs no way to tell "measure differently" from "give up".
//
// Builds an isolated PATH containing only a fake `ffmpeg` stub (no `ffprobe`
// at all) so ffprobeDuration's spawnSync("ffprobe", ...) call ENOENTs for
// real, then verifies it recovers the duration via the ffmpeg fallback
// instead of returning NaN.
test("ffprobeDuration falls back to ffmpeg when the ffprobe binary itself is missing", () => {
  const dir = mkdtempSync(join(tmpdir(), "tts-ffprobe-fallback-"));
  const fakeFfmpeg = join(dir, "ffmpeg");
  writeFileSync(
    fakeFfmpeg,
    "#!/bin/sh\necho 'Duration: 00:00:02.50, start: 0.000000, bitrate: 128 kb/s' 1>&2\nexit 1\n",
  );
  chmodSync(fakeFfmpeg, 0o755);
  const originalPath = process.env.PATH;
  try {
    process.env.PATH = dir; // only the fake ffmpeg resolves; no real ffprobe on this PATH
    assert.equal(ffprobeDuration("/does/not/matter.wav"), 2.5);
  } finally {
    process.env.PATH = originalPath;
    rmSync(dir, { recursive: true, force: true });
  }
});

test("ffprobeDuration returns NaN when neither ffprobe nor ffmpeg resolve", () => {
  const dir = mkdtempSync(join(tmpdir(), "tts-no-binaries-"));
  const originalPath = process.env.PATH;
  try {
    process.env.PATH = dir; // empty directory — nothing resolves
    assert.ok(Number.isNaN(ffprobeDuration("/does/not/matter.wav")));
  } finally {
    process.env.PATH = originalPath;
    rmSync(dir, { recursive: true, force: true });
  }
});

test("synthesizeOne(elevenlabs) creates the output dir before writing", async () => {
  const dir = mkdtempSync(join(tmpdir(), "tts-el-mkdir-"));
  const wavAbs = join(dir, "assets", "voice", "line-0.wav"); // nested, not yet created
  const savedKey = process.env.ELEVENLABS_API_KEY;
  try {
    // Unset the key so the Python side fails fast — the mkdir must run before
    // the spawn regardless, which is what this guards.
    delete process.env.ELEVENLABS_API_KEY;
    await synthesizeOne({
      provider: "elevenlabs",
      text: "hi",
      voiceId: "v",
      wavAbs,
      hyperframesDir: dir,
    });
    assert.ok(existsSync(dirname(wavAbs)), "output directory should be created");
  } finally {
    if (savedKey === undefined) delete process.env.ELEVENLABS_API_KEY;
    else process.env.ELEVENLABS_API_KEY = savedKey;
    rmSync(dir, { recursive: true, force: true });
  }
});

test("synthesizeHeygen surfaces a thrown HTTP error (e.g. 402) instead of swallowing it", async () => {
  const res = await synthesizeHeygen(
    { text: "hi", voiceId: "v1", lang: "en", speed: 1, wavAbs: "/tmp/x.wav" },
    {
      heygenAuthHeaders: () => ({}),
      heygenJSON: async () => {
        throw new Error("HeyGen POST /voices/speech → HTTP 402\nplan_upgrade_required");
      },
    },
  );
  assert.equal(res.ok, false);
  assert.match(res.error, /402/);
  assert.match(res.error, /plan_upgrade_required/);
});

test("synthesizeHeygen surfaces a failed audio_url fetch with its status", async () => {
  const res = await synthesizeHeygen(
    { text: "hi", voiceId: "v1", lang: "en", speed: 1, wavAbs: "/tmp/x.wav" },
    {
      heygenAuthHeaders: () => ({}),
      heygenJSON: async () => ({ data: { audio_url: "http://audio.example/x" } }),
      fetch: async () => ({ ok: false, status: 403 }),
    },
  );
  assert.equal(res.ok, false);
  assert.match(res.error, /HTTP 403/);
});

test("synthesizeHeygen reports a missing audio_url", async () => {
  const res = await synthesizeHeygen(
    { text: "hi", voiceId: "v1", lang: "en", speed: 1, wavAbs: "/tmp/x.wav" },
    { heygenAuthHeaders: () => ({}), heygenJSON: async () => ({}) },
  );
  assert.equal(res.ok, false);
  assert.match(res.error, /no audio_url/);
});

test("synthesizeHeygen reports wav transcode failures", async () => {
  const dir = mkdtempSync(join(tmpdir(), "hf-tts-test-"));
  try {
    const res = await synthesizeHeygen(
      { text: "hi", voiceId: "v1", lang: "en", speed: 1, wavAbs: join(dir, "voice.wav") },
      {
        heygenAuthHeaders: () => ({}),
        heygenJSON: async () => ({ data: { audio_url: "http://audio.example/x" } }),
        fetch: async () => ({ ok: true, status: 200, arrayBuffer: async () => new ArrayBuffer(0) }),
        transcodeToWav: () => false,
      },
    );
    assert.equal(res.ok, false);
    assert.equal(res.error, "audio transcode failed (ffmpeg; output must be .wav or .mp3)");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("synthesizeHeygen normalizes mp3 output instead of writing response bytes directly", async () => {
  const dir = mkdtempSync(join(tmpdir(), "hf-tts-test-"));
  const output = join(dir, "voice.mp3");
  let captured;
  try {
    const res = await synthesizeHeygen(
      { text: "hi", voiceId: "v1", lang: "en", speed: 1, wavAbs: output },
      {
        heygenAuthHeaders: () => ({}),
        heygenJSON: async () => ({ data: { audio_url: "http://audio.example/x" } }),
        fetch: async () => ({
          ok: true,
          status: 200,
          arrayBuffer: async () => Uint8Array.from([1, 2, 3]).buffer,
        }),
        transcodeAudio: (bytes, destPath) => {
          captured = { bytes: [...bytes], destPath };
          return true;
        },
      },
    );
    assert.equal(res.ok, true);
    assert.deepEqual(captured, { bytes: [1, 2, 3], destPath: output });
    assert.equal(existsSync(output), false, "the network response is never written directly");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test(
  "transcodeAudio decodes cloud bytes from stdin before publishing",
  { skip: spawnSync("ffmpeg", ["-version"], { stdio: "ignore" }).status !== 0 },
  (t) => {
    const dir = mkdtempSync(join(tmpdir(), "hf-tts-transcode-"));
    t.after(() => rmSync(dir, { recursive: true, force: true }));
    const source = spawnSync(
      "ffmpeg",
      [
        "-loglevel",
        "error",
        "-f",
        "lavfi",
        "-i",
        "anullsrc=r=44100:cl=mono",
        "-t",
        "0.05",
        "-f",
        "mp3",
        "pipe:1",
      ],
      { encoding: null, maxBuffer: 1024 * 1024 },
    );
    assert.equal(source.status, 0, source.stderr?.toString());
    const output = join(dir, "normalized.wav");
    assert.equal(transcodeAudio(source.stdout, output), true);
    assert.ok(existsSync(output));
    assert.equal(Buffer.from(readFileSync(output)).subarray(0, 4).toString("ascii"), "RIFF");
  },
);

test("synthResult names a non-zero subprocess exit", () => {
  const res = synthResult({ status: 2 }, "/tmp/none.wav", "kokoro (npx hyperframes tts)");
  assert.equal(res.ok, false);
  assert.match(res.error, /kokoro .* exited with status 2/);
});

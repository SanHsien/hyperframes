import { spawn, spawnSync } from "node:child_process";
import {
  constants,
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  statSync,
} from "node:fs";
import { dirname, extname, join } from "node:path";

const VIDEO_EXTENSIONS = new Set([".mp4", ".m4v", ".mov", ".webm", ".mkv"]);

function remuxArgs(output: string): string[] {
  return [
    "-y",
    "-loglevel",
    "error",
    "-err_detect",
    "explode",
    "-i",
    "pipe:0",
    "-map",
    "0:v:0",
    "-map",
    "0:a?",
    "-map_metadata",
    "-1",
    "-map_chapters",
    "-1",
    "-c",
    "copy",
    output,
  ];
}

function normalizedOutput(destPath: string): { tempDir: string; output: string } {
  const ext = extname(destPath).toLowerCase();
  if (!VIDEO_EXTENSIONS.has(ext)) throw new Error(`unsupported video extension: ${ext || "none"}`);
  mkdirSync(dirname(destPath), { recursive: true });
  const tempDir = mkdtempSync(join(dirname(destPath), ".hf-video-"));
  return { tempDir, output: join(tempDir, `video${ext}`) };
}

function publishNormalized(output: string, destPath: string): void {
  if (!existsSync(output) || statSync(output).size < 1) {
    throw new Error("ffmpeg produced no normalized video");
  }
  copyFileSync(output, destPath, constants.COPYFILE_EXCL);
}

/** Parse and remux buffered cloud video before publishing it. */
export function normalizeVideoBuffer(
  bytes: Uint8Array,
  destPath: string,
  ffmpegPath: string,
): boolean {
  const { tempDir, output } = normalizedOutput(destPath);
  try {
    const result = spawnSync(ffmpegPath, remuxArgs(output), {
      input: bytes,
      stdio: ["pipe", "ignore", "ignore"],
      windowsHide: true,
      timeout: 120_000,
    });
    if (result.status !== 0) return false;
    publishNormalized(output, destPath);
    return true;
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
}

function writeChunk(stream: NodeJS.WritableStream, chunk: Uint8Array): Promise<void> {
  return new Promise((resolve, reject) => {
    stream.write(chunk, (error?: Error | null) => (error ? reject(error) : resolve()));
  });
}

function endStream(stream: NodeJS.WritableStream): Promise<void> {
  return new Promise((resolve, reject) => {
    stream.end((error?: Error | null) => (error ? reject(error) : resolve()));
  });
}

/** Stream cloud video through ffmpeg; only its parsed/remuxed output reaches disk. */
export async function normalizeVideoStream(
  chunks: AsyncIterable<Uint8Array>,
  destPath: string,
  ffmpegPath: string,
  maxBytes: number,
): Promise<number> {
  const { tempDir, output } = normalizedOutput(destPath);
  const child = spawn(ffmpegPath, remuxArgs(output), {
    stdio: ["pipe", "ignore", "ignore"],
    windowsHide: true,
  });
  let settled = false;
  const exited = new Promise<number>((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", (code) => {
      settled = true;
      resolve(code ?? -1);
    });
  });
  const timer = setTimeout(() => child.kill(), 120_000);
  let bytes = 0;
  try {
    for await (const chunk of chunks) {
      if (settled) throw new Error("ffmpeg exited before the video stream completed");
      bytes += chunk.byteLength;
      if (bytes > maxBytes) throw new Error("video exceeded the download byte cap");
      await writeChunk(child.stdin, chunk);
    }
    if (bytes < 1024) throw new Error("video response was too small");
    await endStream(child.stdin);
    if ((await exited) !== 0) throw new Error("ffmpeg rejected the downloaded video");
    publishNormalized(output, destPath);
    return bytes;
  } catch (error) {
    child.stdin.destroy();
    if (!settled) child.kill();
    await exited.catch(() => -1);
    throw error;
  } finally {
    clearTimeout(timer);
    rmSync(tempDir, { recursive: true, force: true });
  }
}

import { swallow } from "./diagnostics";
import type { HfColorGradingTarget } from "../colorGrading";
import type { RuntimeBridgeControlMessage, RuntimeOutboundMessage } from "./types";
import {
  inspectRuntimeProtocol,
  runtimeProtocolFpsToNumber,
  runtimeProtocolMetadata,
  type RuntimeProtocolV1,
} from "./protocol";

type BridgeDeps = {
  onPlay: () => void;
  onPause: () => void;
  onStopMedia: () => void;
  onSeek: (timeSeconds: number, seekMode: "drag" | "commit") => void;
  onTick: () => void;
  onSetMuted: (muted: boolean) => void;
  onSetVolume: (volume: number) => void;
  onSetMediaOutputMuted: (muted: boolean) => void;
  onSetNativeMediaSyncDisabled: (disabled: boolean) => void;
  onSetWebAudioMediaDisabled: (disabled: boolean) => void;
  onSetPlaybackRate: (rate: number) => void;
  onSetIdleHeartbeat: (slow: boolean) => void;
  onSetRootDuration: (durationSeconds: number) => void;
  onSetPlayRange: (startSeconds: number, endSeconds: number | null) => void;
  onSetColorGrading: (target: HfColorGradingTarget | string | null, grading: unknown) => void;
  onSetColorGradingCompare: (
    target: HfColorGradingTarget | string | null,
    compare: unknown,
  ) => void;
  onEnablePickMode: () => void;
  onDisablePickMode: () => void;
  onSetRuntimeData?: (channel: string, payload: unknown, requestId?: number) => void;
  onClearRuntimeData?: (channel: string, requestId?: number) => void;
  getCanonicalFps: () => number;
};

let runtimeProtocolFps = 30;

export function setRuntimeProtocolFps(fps: number): void {
  runtimeProtocolFps = Number.isFinite(fps) && fps > 0 ? fps : 30;
}

export function postRuntimeMessage(payload: RuntimeOutboundMessage): void {
  try {
    window.parent.postMessage({ ...payload, ...runtimeProtocolMetadata(runtimeProtocolFps) }, "*");
  } catch (err) {
    // Cross-frame posting can throw if the parent is gone or origin-isolated.
    swallow("bridge.postMessage", err);
  }
}

type BridgeControlData = Partial<RuntimeBridgeControlMessage & RuntimeProtocolV1>;

// Messages cross a frame boundary, so the action must select from a closed
// set of code-owned branches. Do not turn the message value into an indirect
// function call: that makes the dispatch boundary harder to audit and could
// accidentally become extensible if the handler table changes.
function dispatchControl(action: string, data: BridgeControlData, deps: BridgeDeps): void {
  switch (action) {
    case "play":
      deps.onPlay();
      return;
    case "pause":
      deps.onPause();
      return;
    case "stop-media":
      deps.onStopMedia();
      return;
    case "seek":
      deps.onSeek(resolveSeekTimeSeconds(data, deps), data.seekMode ?? "commit");
      return;
    case "tick":
      deps.onTick();
      return;
    case "set-muted":
      deps.onSetMuted(Boolean(data.muted));
      return;
    case "set-volume":
      deps.onSetVolume(Math.max(0, Math.min(1, Number(data.volume ?? 1))));
      return;
    case "set-media-output-muted":
      deps.onSetMediaOutputMuted(Boolean(data.muted));
      return;
    case "set-native-media-sync-disabled":
      deps.onSetNativeMediaSyncDisabled(Boolean(data.disabled));
      return;
    case "set-web-audio-media-disabled":
      deps.onSetWebAudioMediaDisabled(Boolean(data.disabled));
      return;
    case "set-playback-rate":
      deps.onSetPlaybackRate(Number(data.playbackRate ?? 1));
      return;
    case "set-idle-heartbeat":
      deps.onSetIdleHeartbeat(Boolean(data.slow));
      return;
    case "set-root-duration":
      deps.onSetRootDuration(Number(data.durationSeconds ?? 0));
      return;
    case "set-play-range":
      deps.onSetPlayRange(
        Number(data.startSeconds ?? 0),
        data.endSeconds == null ? null : Number(data.endSeconds),
      );
      return;
    case "set-color-grading":
      deps.onSetColorGrading(data.target ?? null, data.grading ?? null);
      return;
    case "set-color-grading-compare":
      deps.onSetColorGradingCompare(data.target ?? null, data.compare ?? null);
      return;
    case "enable-pick-mode":
      deps.onEnablePickMode();
      return;
    case "disable-pick-mode":
      deps.onDisablePickMode();
      return;
    case "flash-elements":
      handleFlashElements(data);
      return;
    case "set-runtime-data":
      if (typeof data.channel === "string")
        deps.onSetRuntimeData?.(data.channel, data.payload, data.requestId);
      return;
    case "clear-runtime-data":
      if (typeof data.channel === "string") deps.onClearRuntimeData?.(data.channel, data.requestId);
      return;
  }
}

function resolveSeekTimeSeconds(data: BridgeControlData, deps: BridgeDeps): number {
  const explicitSeconds = Number(data.timeSeconds);
  if (Number.isFinite(explicitSeconds)) return Math.max(0, explicitSeconds);
  const messageFps = runtimeProtocolFpsToNumber(data.fps);
  const fps = messageFps ?? deps.getCanonicalFps();
  return Math.max(0, Number(data.frame ?? 0)) / fps;
}

function rejectUnsupportedProtocol(data: BridgeControlData): boolean {
  const protocol = inspectRuntimeProtocol(data);
  if (protocol.status !== "unsupported") return false;
  postRuntimeMessage({
    source: "hf-preview",
    type: "diagnostic",
    code: `runtime.protocol.${protocol.code}`,
    details: {
      receivedVersion:
        typeof protocol.receivedVersion === "string" || typeof protocol.receivedVersion === "number"
          ? protocol.receivedVersion
          : null,
    },
  });
  return true;
}

function handleFlashElements(data: BridgeControlData): void {
  // Briefly highlight elements — used by the chat-canvas bridge
  // to show what changed after an agent edit
  const selectors = (data as Record<string, unknown>).selectors as string[] | undefined;
  const duration = ((data as Record<string, unknown>).duration as number) || 800;
  if (selectors) {
    flashElements(selectors, duration);
  }
}

export function installRuntimeControlBridge(deps: BridgeDeps): (event: MessageEvent) => void {
  const handler = (event: MessageEvent) => {
    if (event.source !== window.parent && event.source !== window) return;
    const data = event.data as BridgeControlData | null;
    if (!data || data.source !== "hf-parent" || data.type !== "control") return;
    if (rejectUnsupportedProtocol(data)) return;
    const action = data.action;
    if (typeof action !== "string") return;
    dispatchControl(action, data, deps);
  };
  window.addEventListener("message", handler);
  // Announce that the bridge listener is installed so the parent can replay
  // any control messages it posted before the iframe runtime was ready
  // (avoids losing the initial `set-muted` / `set-volume` / `set-playback-rate`
  // when the parent finishes loading before the iframe does — a deterministic
  // race on warm-cache reloads and inside the Claude desktop Electron client).
  postRuntimeMessage({ source: "hf-preview", type: "ready" });
  return handler;
}

/**
 * Flash elements — briefly highlight them with a blue outline.
 * Used by the chat-canvas bridge to show what changed after an agent edit.
 */
function flashElements(selectors: string[], duration: number): void {
  if (!document.getElementById("__hf-flash-styles")) {
    const style = document.createElement("style");
    style.id = "__hf-flash-styles";
    style.textContent = `
      .__hf-flash {
        outline: 2px solid rgba(59, 130, 246, 0.6) !important;
        outline-offset: 2px !important;
        animation: __hf-flash-pulse ${duration}ms ease-out forwards !important;
      }
      @keyframes __hf-flash-pulse {
        0% { outline-color: rgba(59, 130, 246, 0.8); }
        100% { outline-color: transparent; }
      }
    `;
    document.head.appendChild(style);
  }

  for (const selector of selectors) {
    try {
      const els = document.querySelectorAll(selector);
      els.forEach((el) => {
        el.classList.add("__hf-flash");
        setTimeout(() => el.classList.remove("__hf-flash"), duration);
      });
    } catch (err) {
      // Invalid selector — skip
      swallow("bridge.flashElements.querySelector", err);
    }
  }
}

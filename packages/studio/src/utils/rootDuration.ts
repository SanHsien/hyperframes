import { formatTimelineAttributeNumber } from "../player/components/timelineEditing";

// The first completed opening tag carrying a composition attribute.
const ROOT_COMPOSITION_ATTRIBUTE_RE = /\bdata-composition-id(?=[\s=/>])/i;

function findRootOpeningTag(source: string): { index: number; tag: string } | null {
  let start = -1;
  let quote = "";
  // Disjoint tag spans prevent malformed input from rescanning the document.
  for (let index = 0; index < source.length; index++) {
    const char = source[index];
    if (char === "<" && !quote) start = index;
    else if (source[index] === ">" && start !== -1) {
      const tag = source.slice(start, index + 1);
      if (ROOT_COMPOSITION_ATTRIBUTE_RE.test(tag)) return { index: start, tag };
      start = -1;
      quote = "";
    } else if (start !== -1 && (char === '"' || char === "'")) {
      if (!quote) quote = char;
      else if (quote === char) quote = "";
    }
  }
  return null;
}

/**
 * Matches a `data-duration="..."` attribute inside a single opening tag. Quote
 * style is captured (backreferenced), so both `"` and `'` round-trip, and the
 * `\s*` around `=` tolerates author whitespace.
 */
const DATA_DURATION_ATTR_RE = /(\bdata-duration\s*=\s*)(["'])[^"']*\2/i;

/**
 * Read the ROOT composition's raw `data-duration`.
 *
 * Parses the source with DOMParser and locates the root the same way the rest of
 * the timeline code does — the first `[data-composition-id]` element in document
 * order — then reads its `data-duration`. Because it works on the parsed tree,
 * attribute order and quote style are irrelevant, unlike the previous
 * order-dependent, double-quotes-only regex.
 *
 * Returns `null` when there is no root composition or the root has no
 * `data-duration` attribute at all. When the attribute is present but not a
 * number the parsed `NaN` is returned as-is, so callers reproduce the old
 * regex's "attribute matched but value unusable" behavior.
 *
 * Deterministic and render-safe: DOMParser is the only DOM global used.
 */
export function readRootCompositionDuration(source: string): number | null {
  return rootCompositionDurationOf(new DOMParser().parseFromString(source, "text/html"));
}

export function rootCompositionDurationOf(doc: Document): number | null {
  const raw = doc.querySelector("[data-composition-id]")?.getAttribute("data-duration");
  if (raw == null) return null;
  return Number.parseFloat(raw);
}

/**
 * Rewrite the ROOT composition's `data-duration` value, preserving the rest of
 * the document byte-for-byte.
 *
 * We deliberately do NOT re-serialize the parsed Document: a DOMParser round-trip
 * injects `<html>/<head>/<body>`, forces double quotes, self-closes void
 * elements, and drops the original indentation — it reformats unrelated markup.
 * Instead we locate the root opening tag and rewrite only its `data-duration`
 * value in place, keeping the author's quote style. The targeted splice is
 * attribute-order-, quote-, and whitespace-agnostic.
 *
 * No-op (returns `source` unchanged) when there is no root composition tag or the
 * root tag has no `data-duration` attribute to replace.
 */
export function patchRootCompositionDuration(source: string, newValue: string): string {
  const rootTag = findRootOpeningTag(source);
  if (!rootTag) return source;
  const patchedTag = rootTag.tag.replace(
    DATA_DURATION_ATTR_RE,
    (_full, prefix: string, quote: string) => `${prefix}${quote}${newValue}${quote}`,
  );
  if (patchedTag === rootTag.tag) return source;
  return (
    source.slice(0, rootTag.index) + patchedTag + source.slice(rootTag.index + rootTag.tag.length)
  );
}

/**
 * Grow-only ratchet: extend the root composition's `data-duration` to `newEnd`
 * when `newEnd` is larger than the current root duration. No-op otherwise (and
 * when there is no root duration to compare against).
 */
export function extendRootDurationInSource(source: string, newEnd: number): string {
  const current = readRootCompositionDuration(source);
  if (current == null || !(newEnd > current)) return source;
  return patchRootCompositionDuration(source, formatTimelineAttributeNumber(newEnd));
}

import { parseHTML } from "linkedom";

const FRAMEWORK_SRC_PATTERNS = [
  /_next\/static\/chunks\/(main|framework|webpack|pages\/)/,
  /_next\/static\/chunks\/app\//,
  /_buildManifest\.js/,
  /_ssgManifest\.js/,
];

const NEXT_BOOTSTRAP_MARKERS = [
  "__next_f",
  "self.__next_f",
  "__NEXT_LOADED_PAGES__",
  "_N_E",
  "__NEXT_P",
];

function removeMatchingScripts(source: string, shouldRemove: (script: Element) => boolean): string {
  const { document } = parseHTML("<html><body></body></html>");
  document.body.innerHTML = source;

  const clean = (root: Element, templateDepth: number): void => {
    const pending = Array.from(root.children);
    while (pending.length > 0) {
      const element = pending.pop()!;
      for (const attribute of Array.from(element.attributes)) {
        if (attribute.name.toLowerCase() === "data-reactroot") {
          element.removeAttribute(attribute.name);
        }
      }
      if (element.localName.toLowerCase() === "script") {
        if (element.id === "__NEXT_DATA__" || shouldRemove(element)) element.remove();
      } else if (element.localName.toLowerCase() === "template") {
        if (templateDepth >= 16) throw new Error("Framework template nesting exceeds 16");
        const nested = parseHTML("<html><body></body></html>").document;
        nested.body.innerHTML = element.innerHTML;
        clean(nested.body, templateDepth + 1);
        element.innerHTML = nested.body.innerHTML;
      } else {
        for (const child of Array.from(element.children)) pending.push(child);
      }
    }
  };
  clean(document.body, 0);
  return document.body.innerHTML;
}

export function filterExtractedScripts(
  bodyHtml: string,
  headHtml: string,
): { bodyHtml: string; headHtml: string } {
  const body = removeMatchingScripts(bodyHtml, (script) =>
    NEXT_BOOTSTRAP_MARKERS.some((marker) => script.textContent?.includes(marker)),
  );
  const head = removeMatchingScripts(headHtml, (script) => {
    const src = script.getAttribute("src") ?? "";
    return FRAMEWORK_SRC_PATTERNS.some((pattern) => pattern.test(src));
  });
  return { bodyHtml: body, headHtml: head };
}

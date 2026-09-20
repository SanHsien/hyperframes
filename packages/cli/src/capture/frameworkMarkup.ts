import { parseHTML } from "linkedom";

const FRAMEWORK_SRC_PATTERNS = [
  /_next\/static\/chunks\/(main|framework|webpack|pages\/)/,
  /_next\/static\/chunks\/app\//,
  /_buildManifest\.js/,
  /_ssgManifest\.js/,
];

function stripBodyFrameworkNodes(document: Document, templateDepth = 0): void {
  for (const element of document.querySelectorAll("[data-reactroot]")) {
    element.removeAttribute("data-reactroot");
  }
  for (const script of document.querySelectorAll("script")) {
    const content = script.textContent ?? "";
    if (
      script.id === "__NEXT_DATA__" ||
      content.includes("__next_f") ||
      content.includes("self.__next_f") ||
      content.includes("__NEXT_LOADED_PAGES__") ||
      content.includes("_N_E") ||
      content.includes("__NEXT_P")
    ) {
      script.remove();
    }
  }
  if (templateDepth < 16) {
    for (const template of document.querySelectorAll("template")) {
      const nested = parseHTML("<html><body></body></html>").document;
      nested.body.innerHTML = template.innerHTML;
      stripBodyFrameworkNodes(nested, templateDepth + 1);
      template.innerHTML = nested.body.innerHTML;
    }
  }
}

export function stripFrameworkMarkup(
  bodyHtml: string,
  headHtml: string,
): { bodyHtml: string; headHtml: string } {
  // Parse instead of filtering tags with regexes: mixed-case tags, whitespace
  // before `>`, and overlapping markup must not survive the cleanup.
  const bodyDocument = parseHTML("<html><body></body></html>").document;
  bodyDocument.body.innerHTML = bodyHtml;
  stripBodyFrameworkNodes(bodyDocument);

  const headDocument = parseHTML("<html><head></head><body></body></html>").document;
  headDocument.head.innerHTML = headHtml;
  for (const script of headDocument.head.querySelectorAll("script[src]")) {
    const src = script.getAttribute("src") ?? "";
    if (FRAMEWORK_SRC_PATTERNS.some((pattern) => pattern.test(src))) script.remove();
  }

  return { bodyHtml: bodyDocument.body.innerHTML, headHtml: headDocument.head.innerHTML };
}

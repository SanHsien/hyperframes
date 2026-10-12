import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { test } from "node:test";
import ts from "typescript";

function consumer(relative) {
  const file = fileURLToPath(new URL(relative, import.meta.url));
  const source = readFileSync(file, "utf8");
  const tree = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  let loader;
  const declarations = new Map();
  const visit = (node) => {
    if (
      ts.isFunctionDeclaration(node) &&
      node.body?.getText(tree).includes("The logo must be a project asset path")
    )
      loader = node;
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name))
      declarations.set(node.name.text, node);
    ts.forEachChild(node, visit);
  };
  visit(tree);
  assert.ok(loader, "actual consumer must contain URL rejection before fetch");
  const code = loader.getText(tree).replace(/^export\s+/, "");
  const guardName = code.match(/if\s*\(\s*!([\w$]+)\(/)?.[1];
  const defaultsName = code.match(/\.\.\.([\w$]+)/)?.[1];
  const svgName = code.match(/new\s+([\w$]+)\(\)\.parse/)?.[1];
  assert.ok(guardName && defaultsName && svgName, "locate real URL guard and SVG parse boundary");
  const guard = declarations.get(guardName)?.initializer?.getText(tree);
  assert.ok(guard, "execute actual source/bundle guard, not a copied predicate");
  const calls = [];
  const context = vm.createContext({
    [defaultsName]: {},
    [svgName]: class {
      parse() {
        return { paths: [] };
      }
    },
    fetch: async (url, options) => {
      calls.push({ url, options });
      return { ok: true, text: async () => '<svg xmlns="http://www.w3.org/2000/svg"/>' };
    },
  });
  const executable = ts.transpileModule(
    `const ${guardName} = ${guard};\n${code}\nglobalThis.consumer = ${loader.name.text};`,
    {
      compilerOptions: { target: ts.ScriptTarget.ES2022 },
    },
  ).outputText;
  vm.runInContext(executable, context);
  return { load: context.consumer, calls };
}

for (const [label, file] of [
  ["source", "../src/shape/logo.ts"],
  ["actual shipped bundle", "../../assets/frost.js"],
]) {
  test(`${label}: rejects external and browser-normalized control URLs before fetch`, async () => {
    const { load, calls } = consumer(file);
    for (const url of [
      "https://example.com/logo.svg",
      "//example.com/logo.svg",
      "/\\example.com/logo.svg",
      "ht\ttps://example.com/logo.svg",
      "ht\rtps://example.com/logo.svg",
      "ht\ntps://example.com/logo.svg",
      "\u0000assets/logo.svg",
      "assets/\u007flogo.svg",
      " https://example.com/logo.svg",
      "assets/logo.svg ",
    ]) {
      await assert.rejects(load(url), /project asset path/);
      assert.equal(calls.length, 0, `must not fetch ${JSON.stringify(url)}`);
    }
  });
  test(`${label}: fetches unchanged project and SVG data URLs with safe request options`, async () => {
    const { load, calls } = consumer(file);
    for (const url of [
      "assets/logo.svg",
      "../assets/logo.svg",
      "/assets/logo.svg",
      "assets/my logo.svg",
      "data:image/svg+xml,%3Csvg%2F%3E",
      'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>',
    ]) {
      assert.equal((await load(url)).length, 0);
      const call = calls.at(-1);
      assert.equal(call.url, url);
      assert.equal(call.options.credentials, "omit");
      assert.equal(call.options.redirect, "error");
    }
    assert.equal(calls.length, 6);
  });
}

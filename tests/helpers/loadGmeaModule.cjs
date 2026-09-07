const fs = require("node:fs"),
  path = require("node:path"),
  ts = require("typescript");
module.exports = function load(relativePath, mocks = {}, cache = new Map()) {
  const filename = path.resolve(relativePath);
  if (cache.has(filename)) return cache.get(filename).exports;
  const code = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      jsx: ts.JsxEmit.ReactJSX,
    },
  }).outputText;
  const loaded = { exports: {} };
  cache.set(filename, loaded);
  const localRequire = (spec) => {
    if (Object.prototype.hasOwnProperty.call(mocks, spec)) return mocks[spec];
    if (spec.startsWith(".") || spec.startsWith("@/")) {
      const base = spec.startsWith("@/")
        ? path.resolve(spec.slice(2))
        : path.resolve(path.dirname(filename), spec);
      const candidate = [base, base + ".ts", base + ".tsx"].find(
        (p) => fs.existsSync(p) && fs.statSync(p).isFile(),
      );
      return module.exports(candidate, mocks, cache);
    }
    return require(spec);
  };
  new Function("require", "module", "exports", code)(
    localRequire,
    loaded,
    loaded.exports,
  );
  return loaded.exports;
};

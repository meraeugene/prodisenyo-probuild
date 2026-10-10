const fs = require("node:fs");
const http = require("node:http");
const { build } = require("esbuild");
const postcss = require("postcss");
const tailwind = require("tailwindcss");

async function main() {
  const bundle = await build({
    entryPoints: ["./tests/workspace/uiHarness.tsx"], bundle: true, write: false,
    outdir: "out", platform: "browser", format: "iife", jsx: "automatic",
    define: { "process.env.NODE_ENV": '"development"' },
    plugins: [require("../tests/workspace/browserAdapters.cjs"), require("../tests/ceo/browserAdapters.cjs")],
  });
  const js = bundle.outputFiles.find(file => file.path.endsWith(".js")).text;
  const modulesCss = bundle.outputFiles.find(file => file.path.endsWith(".css"))?.text || "";
  const css = (await postcss([tailwind("tailwind.config.ts")]).process(
    fs.readFileSync("app/globals.css", "utf8"), { from: undefined },
  )).css + fs.readFileSync("app/workspace.css", "utf8") + modulesCss;
  const server = http.createServer((request, response) => {
    const pathname = new URL(request.url, "http://localhost").pathname;
    if (pathname === "/bundle.js") {
      response.setHeader("Content-Type", "application/javascript"); response.end(js);
    } else if (pathname === "/styles.css") {
      response.setHeader("Content-Type", "text/css"); response.end(css);
    } else if (pathname === "/prodisenyo-building-mark.png") {
      response.setHeader("Content-Type", "image/png"); response.end(fs.readFileSync("public/prodisenyo-building-mark.png"));
    } else {
      response.setHeader("Content-Type", "text/html");
      response.end('<html><head><title>Loading screen preview</title><meta name="viewport" content="width=device-width, initial-scale=1"/><link rel="stylesheet" href="/styles.css"/></head><body><div id="root"></div><script src="/bundle.js"></script></body></html>');
    }
  });
  server.listen(4173, "127.0.0.1", () => console.log("Loading screen preview: http://localhost:4173/skeletons?case=ceo"));
}

main().catch(error => { console.error(error); process.exitCode = 1; });

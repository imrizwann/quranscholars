import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, realpath, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { tmpdir } from "node:os";
import { createServer, resolveConfig } from "vite";

const imports = source => [...source.matchAll(/(?:from\s*|import\s*)["']([^"']+)["']/g)].map(match => match[1]);

test("the app, React DOM and video player share one optimized React module", { timeout: 60000 }, async () => {
  const config = await resolveConfig({}, "serve");
  // node_modules can be a junction shared by multiple worktrees and Vite servers.
  assert.equal(await realpath(dirname(config.cacheDir)), await realpath(config.root), "dependency cache must belong to this checkout");
  const cacheDir = await mkdtemp(resolve(tmpdir(), "qs-player-vite-"));
  let server;
  try {
    server = await createServer({
      cacheDir,
      logLevel: "silent",
      server: { host: "127.0.0.1", port: 0, strictPort: true, hmr: false },
      optimizeDeps: { noDiscovery: true, include: ["react", "react-dom/client", "@vidstack/react"] },
    });
    await server.listen();
    const base = `http://127.0.0.1:${server.httpServer.address().port}`;
    const read = async url => {
      const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
      assert.equal(response.status, 200, new URL(url).pathname);
      return response.text();
    };
    const queue = [];
    for (const path of ["/src/main.jsx", "/src/components/video-player/VideoPlayer.jsx"]) {
      for (const specifier of imports(await read(base + path))) {
        const url = new URL(specifier, base);
        if (/\/(react|react-dom_client|@vidstack_react)\.js$/.test(url.pathname)) queue.push(url.href);
      }
    }
    assert(queue.some(url => url.includes("@vidstack_react.js")));
    assert(queue.some(url => url.includes("react-dom_client.js")));
    const visited = new Set(), reactModules = new Set();
    while (queue.length) {
      const url = queue.shift();
      if (visited.has(url)) continue;
      visited.add(url);
      const source = await read(url);
      if (/\/react\/cjs\/react.development.js/.test(source)) reactModules.add(url);
      for (const specifier of imports(source)) {
        const dependency = new URL(specifier, url);
        if (dependency.origin === base && dependency.pathname.includes("/deps/") && dependency.pathname.endsWith(".js")) queue.push(dependency.href);
      }
    }
    // Query strings count: the browser instantiates differently versioned URLs separately.
    assert.equal(reactModules.size, 1, `React was loaded through different URLs: ${[...reactModules].join(", ")}`);
  } finally {
    await server?.close();
    await rm(cacheDir, { recursive: true, force: true });
  }
});

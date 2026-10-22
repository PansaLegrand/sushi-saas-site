import { spawn } from "node:child_process";
import { access } from "node:fs/promises";
import { createServer } from "node:net";
import { setTimeout as delay } from "node:timers/promises";

const root = new URL("../", import.meta.url);
const children = new Set();
const shutdown = new AbortController();
const startupTimeoutMs = 60_000;
const testTimeoutMs = 120_000;

async function freePort() {
  const listener = createServer();
  await new Promise((resolve, reject) => {
    listener.once("error", reject);
    listener.listen(0, "localhost", resolve);
  });
  const { port } = listener.address();
  await new Promise((resolve, reject) => listener.close((error) => error ? reject(error) : resolve()));
  return port;
}

function start(args, options = {}) {
  const child = spawn(process.execPath, args, {
    cwd: root,
    env: { ...process.env, NODE_ENV: "production", NEXT_TELEMETRY_DISABLED: "1", ...options.env },
    stdio: options.stdio ?? "inherit"
  });
  children.add(child);
  // Register immediately, including spawn failures before readiness polling.
  child.finished = new Promise((resolve) => {
    child.once("error", (error) => resolve({ error }));
    child.once("exit", (code, signal) => {
      children.delete(child);
      resolve({ code, signal });
    });
  });
  return child;
}

async function stop(child) {
  if (!children.has(child)) return;
  child.kill("SIGTERM");
  const exited = await Promise.race([child.finished.then(() => true), delay(3_000).then(() => false)]);
  if (!exited) {
    child.kill("SIGKILL");
    await Promise.race([child.finished, delay(1_000)]);
  }
  children.delete(child);
}

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.once(signal, () => shutdown.abort(new Error(`Interrupted by ${signal}`)));
}

let serverOutput = "";
try {
  await access(new URL(".next/BUILD_ID", root));
  const port = await freePort();
  const baseUrl = `http://localhost:${port}`;
  const server = start([
    "node_modules/next/dist/bin/next", "start", "--hostname", "localhost", "--port", String(port)
  ], { stdio: ["ignore", "pipe", "pipe"] });
  for (const stream of [server.stdout, server.stderr]) {
    stream.on("data", (data) => { serverOutput = `${serverOutput}${data}`.slice(-30_000); });
  }

  const startupDeadline = Date.now() + startupTimeoutMs;
  while (true) {
    shutdown.signal.throwIfAborted();
    const ended = await Promise.race([server.finished, Promise.resolve(null)]);
    if (ended) throw ended.error ?? new Error(`Production server exited (${ended.code ?? ended.signal})`);
    if (Date.now() >= startupDeadline) throw new Error("Production server did not become ready within 60 seconds");
    try {
      const response = await fetch(baseUrl, {
        signal: AbortSignal.any([shutdown.signal, AbortSignal.timeout(2_000)])
      });
      await response.body?.cancel();
      if (response.ok) break;
    } catch {
      // A refused connection is expected while Next.js starts.
    }
    await delay(200, undefined, { signal: shutdown.signal });
  }

  console.log(`Checking built site at ${baseUrl}`);
  const tests = start(["--test", "--test-timeout", String(testTimeoutMs), "tests/rendered-seo.test.mjs"], {
    env: { SEO_TEST_BASE_URL: baseUrl }
  });
  const timeout = new AbortController();
  try {
    const result = await Promise.race([
      tests.finished,
      server.finished.then((ended) => {
        throw ended.error ?? new Error(`Production server stopped during tests (${ended.code ?? ended.signal})`);
      }),
      delay(testTimeoutMs, undefined, { signal: AbortSignal.any([shutdown.signal, timeout.signal]) })
        .then(() => { throw new Error("Production SEO tests exceeded 120 seconds"); })
    ]);
    if (result.error) throw result.error;
    if (result.code !== 0) throw new Error(`Production SEO tests failed (${result.code ?? result.signal})`);
  } finally {
    timeout.abort();
  }
} catch (error) {
  console.error(error.code === "ENOENT" ? "No production build found. Run pnpm build first." : error.message);
  if (serverOutput) console.error(serverOutput);
  process.exitCode = 1;
} finally {
  await Promise.all([...children].map(stop));
}

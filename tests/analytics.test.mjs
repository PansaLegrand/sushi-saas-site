import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

function moduleUrl(path, dependencies = {}, replacements = {}) {
  let source = readFileSync(new URL(path, import.meta.url), "utf8");
  for (const [from, to] of Object.entries(replacements)) source = source.replaceAll(from, to);
  let compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 }
  }).outputText;
  for (const [name, url] of Object.entries(dependencies)) compiled = compiled.replaceAll(`"${name}"`, `"${url}"`);
  return `data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`;
}

const policyUrl = moduleUrl("../src/lib/analytics/policy.ts");
const policy = await import(policyUrl);
const config = { provider: "plausible", domain: "www.sushisaas.com" };

test("analytics requires an explicit supported provider and plain hostname", () => {
  for (const [provider, domain] of [
    [undefined, undefined], ["plausible", ""], ["anything", "example.com"],
    ["plausible", "https://example.com"], ["plausible", "example.com/a"],
    ["plausible", "name@example.com"], ["plausible", "example.com?email=private"],
    ["plausible", "-invalid.example"], ["plausible", "example..com"]
  ]) assert.equal(policy.parseAnalyticsConfig(provider, domain), null);
  assert.deepEqual(policy.parseAnalyticsConfig("plausible", " WWW.SUSHISAAS.COM "), config);
});

test("CSP only permits the fixed collection origin when analytics is explicitly configured", () => {
  assert.equal(policy.analyticsConnectSrc(undefined, undefined), "connect-src 'self'");
  assert.equal(policy.analyticsConnectSrc("plausible", ""), "connect-src 'self'");
  assert.equal(policy.analyticsConnectSrc("other", "example.com"), "connect-src 'self'");
  assert.equal(policy.analyticsConnectSrc("plausible", "https://evil.test"), "connect-src 'self'");
  assert.equal(policy.analyticsConnectSrc("plausible", "www.sushisaas.com"), "connect-src 'self' https://plausible.io");
});

test("consent and browser privacy signals fail closed", () => {
  for (const value of [null, "true", "yes", "{accepted:true}"]) assert.equal(policy.parseConsent(value), "unknown");
  assert.equal(policy.mayTrack(null, "accepted", false), false);
  assert.equal(policy.mayTrack(config, "unknown", false), false);
  assert.equal(policy.mayTrack(config, "declined", false), false);
  assert.equal(policy.mayTrack(config, "accepted", true), false);
  assert.equal(policy.mayTrack(config, "accepted", false), true);
  for (const signal of [{ doNotTrack: "1" }, { doNotTrack: "yes" }, { windowDoNotTrack: "1" }, { globalPrivacyControl: true }]) {
    assert.equal(policy.privacySignalBlocksAnalytics(signal), true);
  }
  assert.equal(policy.privacySignalBlocksAnalytics({ doNotTrack: "0" }), false);
});

test("only the exact configured host may display analytics controls or send events", () => {
  assert.equal(policy.isAnalyticsHost(config, "www.sushisaas.com"), true);
  assert.equal(policy.isAnalyticsHost(null, "www.sushisaas.com"), false);
  for (const hostname of ["sushisaas.com", "preview.sushisaas.com", "www.sushisaas.com.evil.test", "localhost", ""]) {
    assert.equal(policy.isAnalyticsHost(config, hostname), false);
  }
  assert.equal(policy.isAnalyticsHost({ provider: "plausible", domain: "localhost" }, "localhost"), true);
});

test("route normalization never emits queries, fragments or arbitrary path segments", () => {
  assert.deepEqual(policy.analyticsPage("/fr/docs/quick-start?email=private#password"), { path: "/fr/docs/quick-start", locale: "fr" });
  assert.deepEqual(policy.analyticsPage("/docs/private@example.com/token-secret"), { path: "/docs", locale: "en" });
  assert.deepEqual(policy.analyticsPage("/ja/blogs/arbitrary-person"), { path: "/ja/blogs", locale: "ja" });
  assert.deepEqual(policy.analyticsPage("/es/"), { path: "/es", locale: "es" });
  for (const path of ["https://example.com/", "//example.com/", "/account/private", "/en/private", "/unknown"]) {
    assert.equal(policy.analyticsPage(path), null);
  }
});

test("only published campaign catalog values survive query parsing", () => {
  assert.deepEqual(policy.analyticsCampaign("?utm_campaign=launch&utm_source=github&email=private&gclid=secret&utm_term=private"), {
    campaign: "launch", campaign_source: "github"
  });
  assert.deepEqual(policy.analyticsCampaign("?utm_campaign=private%40example.com&utm_source=https://example.com"), {});
  assert.deepEqual(policy.analyticsCampaign("?utm_campaign=launch&utm_campaign=private&utm_source=GitHub"), {});
});

test("event payloads accept only catalog events and properties", () => {
  const event = policy.createAnalyticsPayload(config, "/fr/docs/quick-start?secret=private", "github_opened", {
    source: "hero", email: "private@example.com", href: "https://example.com/?secret", locale: "user-123", campaign: "private"
  }, "?utm_campaign=launch&token=private");
  assert.deepEqual(event, {
    name: "github_opened", domain: "www.sushisaas.com", url: "https://www.sushisaas.com/fr/docs/quick-start",
    props: { locale: "fr", campaign: "launch", source: "hero" }
  });
  for (const event of ["__proto__", "private@example.com", "login"]) assert.equal(policy.createAnalyticsPayload(config, "/", event), null);
  assert.equal(policy.createAnalyticsPayload(config, "/", "github_opened", { source: "private" }), null);
  assert.equal(policy.createAnalyticsPayload(config, "/", "tour_tab_selected", {}), null);
  assert.equal(policy.createAnalyticsPayload(config, "/", "setup_command_copied", { profile: "core" }).props.profile, "core");
});

let clientCounter = 0;
async function clientFixture({ configured = true, unavailableStorage = false } = {}) {
  const values = new Map();
  const requests = [];
  const writes = [];
  const browser = { location: { hostname: "www.sushisaas.com", pathname: "/fr/", search: "?email=private&utm_source=github" } };
  const nav = { doNotTrack: "0", globalPrivacyControl: false };
  const globals = {
    window: browser,
    navigator: nav,
    localStorage: {
      getItem(key) { if (unavailableStorage) throw new Error("Storage disabled"); return values.get(key) ?? null; },
      setItem(key, value) { if (unavailableStorage) throw new Error("Storage disabled"); writes.push([key, value]); values.set(key, value); }
    },
    fetch: (url, options) => { requests.push({ url, options }); return Promise.resolve({}); }
  };
  const descriptors = new Map(Object.keys(globals).map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  for (const [key, value] of Object.entries(globals)) Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  const client = await import(moduleUrl("../src/lib/analytics/client.ts", { "./policy": policyUrl }, {
    "process.env.NEXT_PUBLIC_ANALYTICS_PROVIDER": JSON.stringify(configured ? "plausible" : ""),
    "process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN": '"www.sushisaas.com"',
    '"use client";': `"use client";\nconst testInstance = ${++clientCounter};`
  }));
  return {
    client, browser, nav, values, requests, writes,
    restore() {
      for (const [key, descriptor] of descriptors) {
        if (descriptor) Object.defineProperty(globalThis, key, descriptor);
        else delete globalThis[key];
      }
    }
  };
}

test("client sends nothing and stores nothing before consent; withdrawal stops future events", async () => {
  const f = await clientFixture();
  try {
    f.client.trackAdoptionEvent("pageview");
    assert.equal(f.requests.length, 0);
    assert.equal(f.writes.length, 0);
    f.client.writeAnalyticsConsent("accepted");
    f.client.trackAdoptionEvent("github_opened", { source: "hero", email: "private" });
    assert.equal(f.requests.length, 1);
    const { url, options } = f.requests[0];
    assert.equal(url, "https://plausible.io/api/event");
    assert.equal(options.credentials, "omit");
    assert.equal(options.referrerPolicy, "no-referrer");
    assert.equal(options.keepalive, true);
    assert.equal(options.headers["Content-Type"], "text/plain");
    assert.doesNotMatch(options.body, /private|email|referrer|token/);
    f.client.writeAnalyticsConsent("declined");
    f.client.trackAdoptionEvent("pageview");
    assert.equal(f.requests.length, 1);
    assert.equal(f.client.readAnalyticsConsent(), "declined");
  } finally { f.restore(); }
});

test("DNT/GPC and preview hostname override accepted consent on every send", async () => {
  const f = await clientFixture();
  try {
    f.client.writeAnalyticsConsent("accepted");
    f.nav.globalPrivacyControl = true;
    f.client.trackAdoptionEvent("pageview");
    f.nav.globalPrivacyControl = false;
    f.nav.doNotTrack = "1";
    f.client.trackAdoptionEvent("pageview");
    f.nav.doNotTrack = "0";
    f.browser.location.hostname = "preview.example.com";
    f.client.trackAdoptionEvent("pageview");
    assert.equal(f.requests.length, 0);
  } finally { f.restore(); }
});

test("disabled deployment stays silent even if consent from an earlier deployment exists", async () => {
  const f = await clientFixture({ configured: false });
  try {
    f.client.writeAnalyticsConsent("accepted");
    f.client.trackAdoptionEvent("pageview");
    assert.equal(f.requests.length, 0);
  } finally { f.restore(); }
});

test("blocked local storage permits only a voluntary document-local choice", async () => {
  const f = await clientFixture({ unavailableStorage: true });
  try {
    f.client.trackAdoptionEvent("pageview");
    assert.equal(f.requests.length, 0);
    f.client.writeAnalyticsConsent("accepted");
    f.client.trackAdoptionEvent("pageview");
    assert.equal(f.requests.length, 1);
    f.client.writeAnalyticsConsent("declined");
    f.client.trackAdoptionEvent("pageview");
    assert.equal(f.requests.length, 1);
    f.client.resetVolatileConsent();
    assert.equal(f.client.readAnalyticsConsent(), "unknown");
  } finally { f.restore(); }
});

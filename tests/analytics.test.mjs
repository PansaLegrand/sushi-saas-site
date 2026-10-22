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
const config = { measurementId: "G-TEST123456", domain: "www.sushisaas.com" };

test("analytics requires a GA4 measurement ID and a plain hostname", () => {
  for (const [id, domain] of [
    [undefined, undefined], ["G-TEST123456", ""], ["UA-12345", "example.com"],
    ["G-abc123", "example.com"], ["G-TEST123456", "https://example.com"],
    ["G-TEST123456", "example.com/a"], ["G-TEST123456", "name@example.com"],
    ["G-TEST123456", "example.com?email=private"], ["G-TEST123456", "-invalid.example"]
  ]) assert.equal(policy.parseAnalyticsConfig(id, domain), null);
  assert.deepEqual(policy.parseAnalyticsConfig(config.measurementId, " WWW.SUSHISAAS.COM "), config);
});

test("CSP adds only exact Google origins when GA4 is explicitly configured", () => {
  const baseline = "script-src 'self' 'unsafe-inline' 'unsafe-eval'";
  assert.equal(policy.analyticsConnectSrc(undefined, undefined), "connect-src 'self'");
  assert.equal(policy.analyticsScriptSrc(undefined, undefined), baseline);
  assert.equal(policy.analyticsConnectSrc("G-TEST123456", ""), "connect-src 'self'");
  assert.equal(policy.analyticsConnectSrc("UA-12345", "example.com"), "connect-src 'self'");
  assert.equal(policy.analyticsConnectSrc(config.measurementId, config.domain), "connect-src 'self' https://www.googletagmanager.com https://www.google-analytics.com https://region1.google-analytics.com");
  assert.equal(policy.analyticsScriptSrc(config.measurementId, config.domain), `${baseline} https://www.googletagmanager.com`);
  assert.doesNotMatch(policy.analyticsConnectSrc(config.measurementId, config.domain), /\*|doubleclick|googleadservices|plausible/);
});

test("GA4 needs its own consent; browser privacy signals fail closed", () => {
  assert.equal(policy.CONSENT_STORAGE_KEY, "sushi:analytics-consent:ga4:v1");
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

test("only the exact configured host may display analytics controls or load Google", () => {
  assert.equal(policy.isAnalyticsHost(config, "www.sushisaas.com"), true);
  assert.equal(policy.isAnalyticsHost(null, "www.sushisaas.com"), false);
  for (const hostname of ["sushisaas.com", "preview.sushisaas.com", "www.sushisaas.com.evil.test", "localhost", ""]) {
    assert.equal(policy.isAnalyticsHost(config, hostname), false);
  }
  assert.equal(policy.isAnalyticsHost({ measurementId: config.measurementId, domain: "localhost" }, "localhost"), true);
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
    site_campaign: "launch", site_campaign_source: "github"
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
    props: { locale: "fr", site_campaign: "launch", source: "hero" }
  });
  for (const event of ["__proto__", "private@example.com", "login"]) assert.equal(policy.createAnalyticsPayload(config, "/", event), null);
  assert.equal(policy.createAnalyticsPayload(config, "/", "github_opened", { source: "private" }), null);
  assert.equal(policy.createAnalyticsPayload(config, "/", "tour_tab_selected", {}), null);
  assert.equal(policy.createAnalyticsPayload(config, "/", "setup_command_copied", { profile: "core" }).props.profile, "core");
  assert.equal(policy.createAnalyticsPayload(config, "/", "pageview").name, "page_view");
});

test("GA configuration disables initial pageviews and ads, and supplies safe page/cookie fields", () => {
  const payload = policy.createAnalyticsPayload(config, "/fr/docs/private?secret=value", "pageview");
  const settings = policy.googleTagConfiguration(payload);
  assert.equal(settings.page_location, "https://www.sushisaas.com/fr/docs");
  assert.equal(settings.page_title, "/fr/docs");
  assert.equal(settings.page_referrer, "");
  assert.equal(settings.ignore_referrer, true);
  assert.equal(settings.send_page_view, false);
  assert.equal(settings.allow_google_signals, false);
  assert.equal(settings.allow_ad_personalization_signals, false);
  assert.equal(settings.cookie_domain, "none");
  assert.equal(settings.cookie_prefix, "sushi");
  assert.equal(settings.cookie_expires, 2592000);
  assert.equal(settings.cookie_update, false);
  assert.doesNotMatch(JSON.stringify(settings), /secret|private/);
});

let clientCounter = 0;
async function clientFixture({ configured = true, unavailableStorage = false } = {}) {
  const values = new Map();
  const scripts = [];
  const writes = [];
  const cookieWrites = [];
  const browser = { location: { hostname: "www.sushisaas.com", pathname: "/fr/", search: "?email=private&utm_source=github" } };
  const nav = { doNotTrack: "0", globalPrivacyControl: false };
  const document = {
    head: { appendChild(script) { scripts.push(script); } },
    createElement(name) { assert.equal(name, "script"); return { remove() { this.removed = true; } }; },
    get cookie() { return "sushi_ga=owned; sushi_ga_TEST123456=session; _ga=unrelated; theme=dark"; },
    set cookie(value) { cookieWrites.push(value); }
  };
  const globals = {
    window: browser,
    document,
    navigator: nav,
    localStorage: {
      getItem(key) { if (unavailableStorage) throw new Error("Storage disabled"); return values.get(key) ?? null; },
      setItem(key, value) { if (unavailableStorage) throw new Error("Storage disabled"); writes.push([key, value]); values.set(key, value); }
    },
    fetch() { assert.fail("The GA adapter must not send its own HTTP event requests"); }
  };
  const descriptors = new Map(Object.keys(globals).map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  for (const [key, value] of Object.entries(globals)) Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  const client = await import(moduleUrl("../src/lib/analytics/client.ts", { "./policy": policyUrl }, {
    "process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID": JSON.stringify(configured ? config.measurementId : ""),
    "process.env.NEXT_PUBLIC_ANALYTICS_HOSTNAME": '"www.sushisaas.com"',
    '"use client";': `"use client";\nconst testInstance = ${++clientCounter};`
  }));
  return {
    client, browser, nav, values, scripts, writes, cookieWrites,
    commands() { return (browser.sushiAnalyticsLayer ?? []).map((command) => Array.from(command)); },
    events() { return this.commands().filter((command) => command[0] === "event"); },
    restore() {
      for (const [key, descriptor] of descriptors) {
        if (descriptor) Object.defineProperty(globalThis, key, descriptor);
        else delete globalThis[key];
      }
    }
  };
}

test("no Google script, command queue, event or new stored choice exists before opt-in", async () => {
  const f = await clientFixture();
  try {
    f.values.set("sushi:analytics-consent:v1", "accepted");
    f.client.trackAdoptionEvent("pageview");
    assert.equal(f.scripts.length, 0);
    assert.equal(f.browser.sushiAnalyticsLayer, undefined);
    assert.equal(f.writes.length, 0);
    assert.equal(f.browser[`ga-disable-${config.measurementId}`], true);
    f.client.writeAnalyticsConsent("declined");
    f.client.trackAdoptionEvent("pageview");
    assert.equal(f.scripts.length, 0);
  } finally { f.restore(); }
});

test("opt-in loads one Google tag with safe defaults and sends only sanitized catalog events", async () => {
  const f = await clientFixture();
  try {
    f.client.writeAnalyticsConsent("accepted");
    assert.equal(f.scripts.length, 0);
    f.client.trackAdoptionEvent("pageview");
    f.client.trackAdoptionEvent("github_opened", { source: "hero", email: "private" });
    assert.equal(f.scripts.length, 1);
    assert.equal(f.scripts[0].src, "https://www.googletagmanager.com/gtag/js?id=G-TEST123456&l=sushiAnalyticsLayer");
    assert.equal(f.scripts[0].referrerPolicy, "no-referrer");
    assert.equal(f.scripts[0].async, true);
    const commands = f.commands();
    assert.deepEqual(commands[0], ["consent", "default", { analytics_storage: "denied", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" }]);
    assert.deepEqual(commands.find((command) => command[0] === "consent" && command[1] === "update")[2], {
      analytics_storage: "granted", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied"
    });
    assert.equal(commands.find((command) => command[0] === "config")[2].send_page_view, false);
    assert.deepEqual(f.events().map((event) => event[1]), ["page_view", "github_opened"]);
    assert.equal(f.events()[1][2].page_location, "https://www.sushisaas.com/fr");
    assert.equal(f.events()[1][2].send_to, config.measurementId);
    assert.equal(f.events()[1][2].site_campaign_source, "github");
    assert.doesNotMatch(JSON.stringify(commands), /private|email|utm_source/);
  } finally { f.restore(); }
});

test("withdrawal while the tag is loading removes queued events; re-consent reuses one script", async () => {
  const f = await clientFixture();
  try {
    f.client.writeAnalyticsConsent("accepted");
    f.client.trackAdoptionEvent("pageview");
    assert.equal(f.events().length, 1);
    f.client.writeAnalyticsConsent("declined");
    assert.equal(f.browser[`ga-disable-${config.measurementId}`], true);
    assert.equal(f.events().length, 0);
    f.scripts[0].onload();
    f.client.trackAdoptionEvent("pageview");
    assert.equal(f.events().length, 0);
    f.client.writeAnalyticsConsent("accepted");
    f.client.trackAdoptionEvent("pageview");
    assert.equal(f.scripts.length, 1);
    assert.equal(f.events().length, 1);
    assert.equal(f.browser[`ga-disable-${config.measurementId}`], false);
  } finally { f.restore(); }
});

test("SPA navigation updates stream-level page context without automatic pageview duplicates", async () => {
  const f = await clientFixture();
  try {
    f.client.writeAnalyticsConsent("accepted");
    f.client.trackAdoptionEvent("pageview");
    f.scripts[0].onload();
    f.client.trackAdoptionEvent("github_opened", { source: "hero" });
    assert.equal(f.commands().filter((command) => command[0] === "config").length, 1);
    f.browser.location.pathname = "/fr/docs/private@example.com";
    f.browser.location.search = "?token=private";
    f.client.trackAdoptionEvent("pageview");
    f.client.trackAdoptionEvent("github_opened", { source: "docs" });
    const configurations = f.commands().filter((command) => command[0] === "config");
    assert.equal(configurations.length, 2);
    assert.equal(configurations[1][2].page_location, "https://www.sushisaas.com/fr/docs");
    assert.equal(configurations[1][2].page_title, "/fr/docs");
    assert.equal(configurations[1][2].page_referrer, "");
    assert.equal(configurations.every((command) => command[2].send_page_view === false), true);
    assert.equal(f.events().filter((command) => command[1] === "page_view").length, 2);
    assert.equal(f.scripts.length, 1);
    assert.doesNotMatch(JSON.stringify(configurations), /private|token/);
  } finally { f.restore(); }
});

test("withdrawal after tag load denies consent, stops manual events and clears only owned cookies", async () => {
  const f = await clientFixture();
  try {
    f.client.writeAnalyticsConsent("accepted");
    f.client.trackAdoptionEvent("pageview");
    f.scripts[0].onload();
    const priorEvents = f.events().length;
    f.client.writeAnalyticsConsent("declined");
    f.client.trackAdoptionEvent("github_opened", { source: "hero" });
    assert.equal(f.events().length, priorEvents);
    assert.equal(f.browser[`ga-disable-${config.measurementId}`], true);
    assert.deepEqual(f.commands().filter((command) => command[0] === "consent").at(-1), ["consent", "update", {
      analytics_storage: "denied", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied"
    }]);
    assert.equal(f.cookieWrites.some((cookie) => cookie.startsWith("sushi_ga=")), true);
    assert.equal(f.cookieWrites.some((cookie) => cookie.startsWith("sushi_ga_TEST123456=")), true);
    assert.equal(f.cookieWrites.some((cookie) => cookie.startsWith("_ga=") || cookie.startsWith("theme=")), false);
  } finally { f.restore(); }
});

test("DNT/GPC and preview hostname override accepted consent before any Google load", async () => {
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
    assert.equal(f.scripts.length, 0);
    assert.equal(f.events().length, 0);
  } finally { f.restore(); }
});

test("a privacy signal after tag load disables Google's collection flag", async () => {
  const f = await clientFixture();
  try {
    f.client.writeAnalyticsConsent("accepted");
    f.client.trackAdoptionEvent("pageview");
    f.scripts[0].onload();
    f.nav.globalPrivacyControl = true;
    f.client.applyAnalyticsPrivacyPreference();
    assert.equal(f.browser[`ga-disable-${config.measurementId}`], true);
    f.client.trackAdoptionEvent("pageview");
    assert.equal(f.events().length, 1);
  } finally { f.restore(); }
});

test("disabled deployment stays silent even with stored GA consent", async () => {
  const f = await clientFixture({ configured: false });
  try {
    f.client.writeAnalyticsConsent("accepted");
    f.client.trackAdoptionEvent("pageview");
    assert.equal(f.scripts.length, 0);
  } finally { f.restore(); }
});

test("blocked local storage permits only a voluntary document-local choice", async () => {
  const f = await clientFixture({ unavailableStorage: true });
  try {
    f.client.trackAdoptionEvent("pageview");
    assert.equal(f.scripts.length, 0);
    f.client.writeAnalyticsConsent("accepted");
    f.client.trackAdoptionEvent("pageview");
    assert.equal(f.scripts.length, 1);
    f.client.writeAnalyticsConsent("declined");
    f.client.trackAdoptionEvent("pageview");
    assert.equal(f.events().length, 0);
    f.client.resetVolatileConsent();
    assert.equal(f.client.readAnalyticsConsent(), "unknown");
  } finally { f.restore(); }
});

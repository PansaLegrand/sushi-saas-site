"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight, Check, CheckCircle2, Copy, Terminal } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { trackAdoptionEvent } from "@/lib/analytics/client";

const profiles = ["core", "operations", "publishing"] as const;
export function StarterProfiles({ starterCommit }: { starterCommit: string }) {
  const t = useTranslations("marketing.profiles");
  const items = t.raw("items") as { name: string; subtitle: string; body: string; features: string[] }[];
  const [selected, setSelected] = useState(0);
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const profile = profiles[selected];
  const command = [
    "git clone https://github.com/PansaLegrand/sushi-saas-template.git",
    "cd sushi-saas-template",
    "git switch -c my-saas " + starterCommit,
    "export SAAS_STARTER_PROFILE=" + profile,
    "pnpm starter " + profile + " install",
    "pnpm starter " + profile + " setup",
    "pnpm starter " + profile + " doctor",
    "pnpm starter " + profile + " demo"
  ].join("\n");
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  async function copy() {
    try {
      await navigator.clipboard.writeText(command);
      setStatus("copied");
      trackAdoptionEvent("setup_command_copied", { profile });
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setStatus("idle"), 2500);
    } catch { setStatus("error"); }
  }
  return <section className="section profiles-section" id="get-started">
    <div className="shell">
      <div className="section-heading">
        <div><p className="eyebrow">{t("eyebrow")}</p><h2>{t("title")}</h2></div>
        <p>{t("description")}</p>
      </div>
      <div className="profile-grid" role="group" aria-label={t("label")}>
        {items.map((item, index) => <button
          className="profile-card" type="button" key={profiles[index]} aria-pressed={selected === index}
          aria-controls="setup-commands" onClick={() => { setSelected(index); setStatus("idle"); }}
        >
          <div className="profile-card__top"><span className="profile-number">0{index + 1}</span>{index === 0 ? <span className="recommendation">{t("recommended")}</span> : null}</div>
          <h3>{item.name}</h3><strong>{item.subtitle}</strong><p>{item.body}</p>
          <ul>{item.features.map(feature => <li key={feature}><CheckCircle2 size={15} aria-hidden="true" />{feature}</li>)}</ul>
        </button>)}
      </div>
      <div className="setup-row">
        <div className="setup-terminal" id="setup-commands">
          <div className="setup-terminal__bar"><span><Terminal size={16} aria-hidden="true" />{t("terminal")}<i>/ {profile}</i></span><button type="button" onClick={() => void copy()}>{status === "copied" ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}{status === "copied" ? t("copied") : t("copy")}</button></div>
          <pre tabIndex={0}><code>{command}</code></pre>
          <span role="status" className={status === "error" ? "copy-error" : "sr-only"}>{status === "error" ? t("copyError") : status === "copied" ? t("copied") : ""}</span>
        </div>
        <div className="setup-next"><p>{t("requirements")}</p><Link href="/docs/quick-start" className="text-link" data-analytics-event="quickstart_opened" data-analytics-source="quickstart">{t("guide")}<ArrowRight size={17} aria-hidden="true" /></Link><small>{t("note")}</small></div>
      </div>
    </div>
  </section>;
}

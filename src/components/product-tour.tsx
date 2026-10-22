"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowUpRight, Coins, Layers3, ShieldCheck } from "lucide-react";
import { trackAdoptionEvent } from "@/lib/analytics/client";
import { useAnalyticsEnabled } from "@/components/analytics/analytics-provider";

const previews = [
  { id: "credits", image: "/product/credits.jpg", icon: Coins },
  { id: "workspace", image: "/product/workspace.jpg", icon: Layers3 },
  { id: "admin", image: "/product/admin.jpg", icon: ShieldCheck }
] as const;

export function ProductTour() {
  const t = useTranslations("marketing.tour");
  const items = t.raw("items") as { tab: string; title: string; body: string; alt: string }[];
  const [selected, setSelected] = useState(0);
  const id = useId();
  const section = useRef<HTMLElement>(null);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const viewRecorded = useRef(false);
  const analyticsEnabled = useAnalyticsEnabled();
  const current = previews[selected];
  const copy = items[selected];

  useEffect(() => {
    const target = section.current;
    if (!target || !analyticsEnabled || viewRecorded.current) return;
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        trackAdoptionEvent("tour_viewed");
        viewRecorded.current = true;
        observer.disconnect();
      }
    }, { threshold: 0.25 });
    observer.observe(target);
    return () => observer.disconnect();
  }, [analyticsEnabled]);

  function select(index: number, focus = false) {
    setSelected(index);
    if (focus) buttons.current[index]?.focus();
    trackAdoptionEvent("tour_tab_selected", { tab: previews[index].id });
  }

  return (
    <section ref={section} className="product-section section" id="product-tour">
      <div className="shell">
        <div className="section-heading section-heading--center">
          <p className="eyebrow">{t("eyebrow")}</p>
          <h2>{t("title")}</h2>
          <p>{t("description")}</p>
        </div>
        <div className="tour-tabs" role="tablist" aria-label={t("label")}>
          {previews.map((preview, index) => {
            const Icon = preview.icon;
            return <button
              key={preview.id}
              type="button"
              role="tab"
              id={id + "-tab-" + index}
              aria-controls={id + "-panel"}
              aria-selected={index === selected}
              tabIndex={index === selected ? 0 : -1}
              ref={element => { buttons.current[index] = element; }}
              onClick={() => select(index)}
              onKeyDown={event => {
                const next = event.key === "ArrowRight" ? (selected + 1) % previews.length
                  : event.key === "ArrowLeft" ? (selected + previews.length - 1) % previews.length
                  : event.key === "Home" ? 0 : event.key === "End" ? previews.length - 1 : null;
                if (next !== null) { event.preventDefault(); select(next, true); }
              }}
            ><Icon size={17} aria-hidden="true" />{items[index].tab}</button>;
          })}
        </div>
        <div id={id + "-panel"} role="tabpanel" tabIndex={0} aria-labelledby={id + "-tab-" + selected} className="tour-panel">
          <div className="browser-frame">
            <div className="browser-frame__bar" aria-hidden="true">
              <span className="browser-dots"><i /><i /><i /></span>
              <span>sushi / {current.id}</span>
              <span className="preview-live"><i />preview</span>
            </div>
            <Image src={current.image} alt={copy.alt} width={1707} height={960} sizes="(max-width: 760px) 100vw, 1120px" className="tour-image" />
          </div>
          <div className="tour-caption">
            <div><h3>{copy.title}</h3><p>{copy.body}</p></div>
            <a href={current.image} target="_blank" rel="noopener noreferrer">{t("expand")}<ArrowUpRight size={16} aria-hidden="true" /></a>
          </div>
        </div>
        <p className="preview-note">{t("note")}</p>
      </div>
    </section>
  );
}

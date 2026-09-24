"use client";

import { BellRing, ChevronRight, Eye, FileText, Megaphone, RotateCcw, Save, Trophy, Users } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import PeopleContentManager, { type StaffMember, type Testimonial } from "./PeopleContentManager";

type JsonObject = Record<string, unknown>;
type Section = { id: string; key: string; label: string; content: JsonObject; isVisible: boolean; displayOrder: number };
type Metric = { value: string; label: string };
type Hero = { eyebrow: string; heading: string; description: string };

const asObject = (value: unknown): JsonObject => value && typeof value === "object" && !Array.isArray(value) ? value as JsonObject : {};
const asString = (value: unknown) => typeof value === "string" ? value : "";
const initialHero: Hero = { eyebrow: "", heading: "", description: "" };

async function request(url: string, options?: RequestInit) {
  const response = await fetch(url, { ...options, headers: { "Content-Type": "application/json", ...options?.headers } });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message || "The landing content request failed.");
  return payload;
}

export default function CmsPage() {
  const [sections, setSections] = useState<Section[]>([]);
  const [hero, setHero] = useState<Hero>(initialHero);
  const [announcement, setAnnouncement] = useState("");
  const [bannerLive, setBannerLive] = useState(false);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = await request("/api/admin/content");
      const content = asObject(payload.content ?? payload);
      const loaded = Array.isArray(content.sections) ? content.sections as Section[] : [];
      const heroSection = loaded.find((section) => section.key === "home.hero");
      const announcementSection = loaded.find((section) => section.key === "home.announcement");
      const statisticsSection = loaded.find((section) => section.key === "home.statistics");
      const heroContent = asObject(heroSection?.content);
      const announcementContent = asObject(announcementSection?.content);
      const statisticsContent = asObject(statisticsSection?.content);
      const statisticItems = Array.isArray(statisticsContent.items) ? statisticsContent.items : [];

      setSections(loaded);
      setHero({ eyebrow: asString(heroContent.eyebrow), heading: asString(heroContent.heading), description: asString(heroContent.description) });
      setAnnouncement(asString(announcementContent.text));
      setBannerLive(announcementSection?.isVisible ?? false);
      setMetrics(statisticItems.map((item) => { const metric = asObject(item); return { value: asString(metric.value), label: asString(metric.label) }; }));
      setStaff(Array.isArray(content.staff) ? content.staff as StaffMember[] : []);
      setTestimonials(Array.isArray(content.testimonials) ? content.testimonials as Testimonial[] : []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load landing content.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const sectionsByKey = useMemo(() => new Map(sections.map((section) => [section.key, section])), [sections]);

  const saveSection = async (key: string, label: string, content: JsonObject, visible: boolean, displayOrder: number) => {
    const existing = sectionsByKey.get(key);
    return request(existing ? `/api/admin/content/sections/${existing.id}` : "/api/admin/content/sections", {
      method: existing ? "PUT" : "POST",
      body: JSON.stringify(existing ? { content: { ...existing.content, ...content }, isVisible: visible } : { page: "home", key, label, content, isVisible: visible, displayOrder }),
    });
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      await Promise.all([
        saveSection("home.hero", "Hero", hero, sectionsByKey.get("home.hero")?.isVisible ?? true, 0),
        saveSection("home.announcement", "Announcement", { text: announcement }, bannerLive, 1),
        saveSection("home.statistics", "Statistics", { items: metrics }, sectionsByKey.get("home.statistics")?.isVisible ?? true, 2),
      ]);
      await load();
      setNotice("Landing content was saved through the backend.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save landing content.");
    } finally {
      setSaving(false);
    }
  };

  const updateMetric = (index: number, field: keyof Metric, value: string) => setMetrics((current) => current.map((metric, metricIndex) => metricIndex === index ? { ...metric, [field]: value } : metric));
  const disabled = loading || saving;

  return <main className="min-h-screen bg-[#f5f7f6] px-4 pb-10 pt-5 sm:px-6 lg:px-8"><div className="mx-auto max-w-[1440px]">
    <header className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between"><div><p className="mb-2 text-xs text-slate-500">Admin Portal <ChevronRight className="mx-1 inline h-3 w-3" /> Landing Page &amp; CMS</p><div className="flex flex-wrap items-center gap-2"><h1 className="text-2xl font-bold tracking-tight text-[#091d15] sm:text-3xl">Landing Page &amp; CMS Management</h1><span className="rounded-full bg-[#cef3e1] px-2 py-1 text-[10px] font-bold uppercase tracking-[.1em] text-[#176148]">{loading ? "Loading" : "Backend connected"}</span></div><p className="mt-1 max-w-3xl text-sm text-slate-500">Edit the hero, announcement, and proof statistics records served by the landing-content API.</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => void load()} disabled={disabled} className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2.5 text-xs font-semibold text-[#33463c] shadow-sm ring-1 ring-[#e5ebe8] disabled:opacity-60"><RotateCcw className="h-4 w-4" /> Discard changes</button><button type="button" onClick={() => window.open("/", "_blank")} className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2.5 text-xs font-semibold text-[#33463c] shadow-sm ring-1 ring-[#e5ebe8]"><Eye className="h-4 w-4" /> View live site</button><button type="button" onClick={() => void save()} disabled={disabled} className="inline-flex items-center gap-2 rounded-lg bg-[#ff9423] px-4 py-2.5 text-xs font-semibold text-[#382000] shadow-sm disabled:opacity-60"><Save className="h-4 w-4" /> {saving ? "Publishing..." : "Save & publish changes"}</button></div></header>
    {error && <p className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    {notice && <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
    <section className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-3"><Status icon={<FileText />} label="Landing data" value={loading ? "Loading..." : `${sections.length} sections`} detail="Read from the admin content API" tone="mint" /><Status icon={<Trophy />} label="Social proof" value={`${staff.length} staff · ${testimonials.length} stories`} detail="Loaded with CMS records" tone="orange" /><Status icon={<Megaphone />} label="Active banner" value={bannerLive ? "Visible to candidates" : "Banner paused"} detail={bannerLive ? "Announcement is enabled" : "Announcement is hidden"} tone="green" /></section>
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_350px]"><div className="space-y-5">
      <section className="rounded-xl border border-[#e5ebe8] bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div className="flex gap-3"><span className="grid h-9 w-9 place-items-center rounded-lg bg-[#ffe5d4] text-[#a74408]"><BellRing className="h-4 w-4" /></span><div><h2 className="font-bold text-[#17291f]">Top Alert &amp; Announcement Ribbon</h2><p className="text-xs text-slate-500">Stored in the <code>home.announcement</code> section.</p></div></div><button type="button" onClick={() => setBannerLive((value) => !value)} disabled={disabled} className={`relative h-6 w-11 rounded-full transition ${bannerLive ? "bg-[#004b37]" : "bg-slate-300"}`} aria-label="Toggle announcement banner"><span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${bannerLive ? "right-1" : "left-1"}`} /></button></div><TextArea label="Announcement content string" value={announcement} onChange={setAnnouncement} disabled={disabled} /></section>
      <section className="rounded-xl border border-[#e5ebe8] bg-white p-5 shadow-sm"><div className="flex gap-3"><span className="grid h-9 w-9 place-items-center rounded-lg bg-[#dff4e8] text-[#004b37]"><FileText className="h-4 w-4" /></span><div><h2 className="font-bold text-[#17291f]">Hero Banner</h2><p className="text-xs text-slate-500">Values are read from and saved to <code>home.hero</code>.</p></div></div><TextInput label="Badge tagline" value={hero.eyebrow} onChange={(eyebrow) => setHero((current) => ({ ...current, eyebrow }))} disabled={disabled} /><TextInput label="Main display headline" value={hero.heading} onChange={(heading) => setHero((current) => ({ ...current, heading }))} disabled={disabled} /><TextArea label="Lead description / narrative" value={hero.description} onChange={(description) => setHero((current) => ({ ...current, description }))} disabled={disabled} /></section>
      <section className="rounded-xl border border-[#e5ebe8] bg-white p-5 shadow-sm"><div className="flex items-center justify-between gap-3"><div className="flex gap-3"><span className="grid h-9 w-9 place-items-center rounded-lg bg-[#fff0e3] text-[#a74408]"><Trophy className="h-4 w-4" /></span><div><h2 className="font-bold text-[#17291f]">Institutional Proof &amp; Statistics Ribbon</h2><p className="text-xs text-slate-500">Values are loaded from <code>home.statistics</code>.</p></div></div><button type="button" onClick={() => setMetrics((current) => [...current, { value: "", label: "" }])} disabled={disabled} className="rounded-lg border border-[#dce7e1] px-3 py-2 text-xs font-semibold text-[#0d4a36] disabled:opacity-60">Add metric</button></div><div className="mt-5 grid gap-3 sm:grid-cols-2">{metrics.map((metric, index) => <article key={`${index}-${metric.label}`} className="rounded-lg bg-[#f1f3f2] p-3"><p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[.12em] text-slate-600"><Users className="h-4 w-4" /> Metric {String(index + 1).padStart(2, "0")}</p><div className="mt-2 grid grid-cols-[90px_1fr] gap-2"><input value={metric.value} onChange={(event) => updateMetric(index, "value", event.target.value)} disabled={disabled} placeholder="Value" className="min-w-0 rounded bg-white px-2 py-2 text-xs font-semibold disabled:opacity-60" /><input value={metric.label} onChange={(event) => updateMetric(index, "label", event.target.value)} disabled={disabled} placeholder="Label" className="min-w-0 rounded bg-white px-2 py-2 text-xs disabled:opacity-60" /></div></article>)}</div></section>
    </div><aside className="space-y-5"><section className="rounded-xl border border-[#e5ebe8] bg-white p-4 shadow-sm"><p className="mb-3 text-[10px] font-bold uppercase tracking-[.13em] text-slate-500">Live viewport simulation</p><div className="overflow-hidden rounded-lg border border-slate-200 bg-[#003d2e] text-white">{bannerLive && <div className="bg-[#ff9423] px-2 py-1 text-[9px] font-bold text-[#3c2100]">{announcement || "Announcement banner"}</div>}<div className="p-4"><p className="text-[8px] font-bold tracking-widest text-[#ffad4c]">{hero.eyebrow || "LANDING PAGE"}</p><h2 className="mt-4 text-xl font-bold leading-5">{hero.heading || "Hero headline"}</h2><p className="mt-3 text-[10px] leading-4 text-white/70">{hero.description || "Hero description"}</p></div>{metrics.length > 0 && <div className="grid grid-cols-4 bg-[#ff9423] px-2 py-2 text-center text-[8px] font-bold text-[#3c2100]">{metrics.slice(0, 4).map((metric, index) => <span key={index}>{metric.value || "—"}<br />{metric.label || "Metric"}</span>)}</div>}</div><p className="mt-3 text-xs text-slate-500">Preview reflects unsaved changes.</p></section><section className="rounded-xl bg-[#004b37] p-4 text-white"><h2 className="font-semibold">Content connection</h2><p className="mt-2 text-xs leading-5 text-white/70">Saving persists the same records the public landing page can fetch from the backend.</p></section></aside></div>
    <PeopleContentManager staff={staff} testimonials={testimonials} onRefresh={load} />
  </div></main>;
}

function TextInput({ label, value, onChange, disabled }: { label: string; value: string; onChange: (value: string) => void; disabled: boolean }) { return <label className="mt-4 block text-[10px] font-bold uppercase tracking-[.12em] text-slate-600">{label}<input value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} className="mt-2 w-full rounded-lg bg-[#f1f3f2] px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#004b37]/20 disabled:opacity-60" /></label>; }
function TextArea({ label, value, onChange, disabled }: { label: string; value: string; onChange: (value: string) => void; disabled: boolean }) { return <label className="mt-5 block text-[10px] font-bold uppercase tracking-[.12em] text-slate-600">{label}<textarea value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} className="mt-2 min-h-20 w-full rounded-lg bg-[#f1f3f2] p-3 text-sm text-[#273a30] outline-none focus:ring-2 focus:ring-[#004b37]/20 disabled:opacity-60" /></label>; }
function Status({ icon, label, value, detail, tone }: { icon: React.ReactNode; label: string; value: string; detail: string; tone: "mint" | "orange" | "green" }) { const colors = { mint: "bg-[#dff4e8] text-[#004b37]", orange: "bg-[#fff0e3] text-[#a74408]", green: "bg-[#004b37] text-white" }; return <article className="rounded-xl border border-[#e5ebe8] bg-white p-4 shadow-sm"><span className={`mb-3 grid h-8 w-8 place-items-center rounded-lg ${colors[tone]}`}>{icon}</span><p className="text-[10px] font-bold uppercase tracking-[.12em] text-slate-500">{label}</p><p className="mt-1 text-lg font-bold text-[#12231a]">{value}</p><p className="mt-1 text-xs text-slate-500">{detail}</p></article>; }

"use client";

import { upload } from "@vercel/blob/client";
import Image from "next/image";
import { useState } from "react";

export type StaffMember = {
  id: string; name: string; role: string | null; course: string | null; bio: string | null;
  imageUrl: string | null; displayOrder: number; isVisible: boolean;
};
export type Testimonial = {
  id: string; studentName: string; quote: string; type: "written" | "video";
  score: string | null; course: string | null; school: string | null;
  imageUrl: string | null; videoUrl: string | null; videoDuration: string | null;
  displayOrder: number; isVerified: boolean; isVisible: boolean;
};

type StaffForm = Omit<StaffMember, "id">;
type TestimonialForm = Omit<Testimonial, "id">;
const emptyStaff: StaffForm = { name: "", role: "", course: "", bio: "", imageUrl: "", displayOrder: 0, isVisible: true };
const emptyTestimonial: TestimonialForm = { studentName: "", quote: "", type: "written", score: "", course: "", school: "", imageUrl: "", videoUrl: "", videoDuration: "", displayOrder: 0, isVerified: false, isVisible: true };
const inputClass = "mt-1 w-full rounded-lg border border-[#dce7e1] bg-white px-3 py-2 text-sm text-[#17291f] outline-none focus:ring-2 focus:ring-[#004b37]/20";
const buttonClass = "rounded-lg border border-[#dce7e1] px-3 py-2 text-xs font-semibold text-[#0d4a36] disabled:cursor-not-allowed disabled:opacity-50";

function mediaUrl(value: string | null | undefined) {
  if (!value) return null;
  try { const url = new URL(value); return url.protocol === "https:" || url.protocol === "http:" ? url.href : null; }
  catch { return null; }
}

async function saveRecord(url: string, method: "POST" | "PUT", body: object) {
  const response = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.message || "The content could not be saved.");
}

function Field({ label, value, onChange, type = "text", required = false, placeholder }: {
  label: string; value: string | number; onChange: (value: string) => void;
  type?: string; required?: boolean; placeholder?: string;
}) {
  return <label className="block text-xs font-semibold text-slate-600">{label}
    <input className={inputClass} type={type} required={required} min={type === "number" ? 0 : undefined} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
  </label>;
}

export default function PeopleContentManager({ staff, testimonials, onRefresh }: {
  staff: StaffMember[]; testimonials: Testimonial[]; onRefresh: () => Promise<void>;
}) {
  const [staffId, setStaffId] = useState<string | null>(null);
  const [testimonialId, setTestimonialId] = useState<string | null>(null);
  const [staffForm, setStaffForm] = useState<StaffForm>(emptyStaff);
  const [testimonialForm, setTestimonialForm] = useState<TestimonialForm>(emptyTestimonial);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startStaff = (member?: StaffMember) => {
    setStaffId(member?.id ?? null);
    setStaffForm(member ? { name: member.name, role: member.role ?? "", course: member.course ?? "", bio: member.bio ?? "", imageUrl: member.imageUrl ?? "", displayOrder: member.displayOrder, isVisible: member.isVisible } : { ...emptyStaff, displayOrder: staff.length });
    setError(null);
  };
  const startTestimonial = (item?: Testimonial) => {
    setTestimonialId(item?.id ?? null);
    setTestimonialForm(item ? { studentName: item.studentName, quote: item.quote, type: item.type, score: item.score ?? "", course: item.course ?? "", school: item.school ?? "", imageUrl: item.imageUrl ?? "", videoUrl: item.videoUrl ?? "", videoDuration: item.videoDuration ?? "", displayOrder: item.displayOrder, isVerified: item.isVerified, isVisible: item.isVisible } : { ...emptyTestimonial, displayOrder: testimonials.length });
    setError(null);
  };
  const run = async (action: () => Promise<void>, success: string) => {
    setSaving(true); setError(null); setNotice(null);
    try { await action(); await onRefresh(); setNotice(success); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "The content could not be saved."); }
    finally { setSaving(false); }
  };
  const uploadMedia = async (file: File, target: "staff" | "student" | "video") => {
    const video = target === "video";
    const types = video ? ["video/mp4", "video/webm"] : ["image/jpeg", "image/png", "image/webp"];
    const max = video ? 100 * 1024 * 1024 : 5 * 1024 * 1024;
    if (!types.includes(file.type) || file.size > max) { setError(`Choose a ${video ? "MP4 or WebM video under 100 MB" : "JPG, PNG, or WebP image under 5 MB"}.`); return; }
    setUploading(target); setProgress(0); setError(null); setNotice(null);
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
      const folder = target === "staff" ? "cms/staff" : video ? "cms/testimonials/videos" : "cms/testimonials/images";
      const blob = await upload(`${folder}/${safeName}`, file, {
        access: "public", handleUploadUrl: "/api/admin/content/media", contentType: file.type,
        multipart: video, onUploadProgress: ({ percentage }) => setProgress(Math.round(percentage)),
      });
      if (target === "staff") setStaffForm((form) => ({ ...form, imageUrl: blob.url }));
      else setTestimonialForm((form) => ({ ...form, [video ? "videoUrl" : "imageUrl"]: blob.url }));
      setNotice("Upload complete. Save the record to publish this media.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Upload failed. Check the Blob store configuration."); }
    finally { setUploading(null); }
  };

  return <div className="mt-6 space-y-6">
    {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    {notice && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
    <section className="rounded-xl border border-[#e5ebe8] bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-bold text-[#17291f]">Staff</h2><p className="text-xs text-slate-500">Add, edit, and control which team members appear on the public landing page.</p></div><button type="button" className={buttonClass} onClick={() => startStaff()}>Add staff member</button></div>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{staff.map((member) => <article key={member.id} className="flex gap-3 rounded-lg border border-[#e5ebe8] p-3">
        {mediaUrl(member.imageUrl) ? <Image unoptimized width={64} height={64} className="h-16 w-16 shrink-0 rounded-lg object-cover" src={mediaUrl(member.imageUrl)!} alt={member.name} /> : <div className="grid h-16 w-16 shrink-0 place-items-center rounded-lg bg-[#dff4e8] text-xl font-bold text-[#004b37]">{member.name.charAt(0)}</div>}
        <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-[#17291f]">{member.name}</p><p className="truncate text-xs text-slate-500">{member.role || "No role"}{member.course ? ` · ${member.course}` : ""}</p><p className={`mt-1 text-[10px] font-semibold ${member.isVisible ? "text-emerald-700" : "text-slate-500"}`}>{member.isVisible ? "Visible" : "Hidden"}</p><div className="mt-2 flex gap-2"><button type="button" className="text-xs font-semibold text-[#004b37]" onClick={() => startStaff(member)}>Edit</button><button type="button" disabled={saving} className="text-xs text-slate-600 disabled:opacity-50" onClick={() => void run(() => saveRecord(`/api/admin/content/staff/${member.id}`, "PUT", { isVisible: !member.isVisible }), member.isVisible ? "Staff member hidden." : "Staff member published.")}>{member.isVisible ? "Hide" : "Show"}</button></div></div>
      </article>)}</div>{!staff.length && <p className="mt-4 text-sm text-slate-500">No staff members yet.</p>}
      <form className="mt-5 rounded-lg bg-[#f5f7f6] p-4" onSubmit={(event) => { event.preventDefault(); if (uploading) return; void run(async () => { await saveRecord(staffId ? `/api/admin/content/staff/${staffId}` : "/api/admin/content/staff", staffId ? "PUT" : "POST", staffForm); startStaff(); }, staffId ? "Staff member updated." : "Staff member added."); }}>
        <h3 className="mb-3 text-sm font-bold text-[#17291f]">{staffId ? "Edit staff member" : "New staff member"}</h3>
        <div className="grid gap-3 sm:grid-cols-2"><Field label="Name" value={staffForm.name} required onChange={(name) => setStaffForm((form) => ({ ...form, name }))} /><Field label="Role" value={staffForm.role ?? ""} onChange={(role) => setStaffForm((form) => ({ ...form, role }))} /><Field label="Course / specialty" value={staffForm.course ?? ""} onChange={(course) => setStaffForm((form) => ({ ...form, course }))} /><Field label="Display order" value={staffForm.displayOrder} type="number" onChange={(order) => setStaffForm((form) => ({ ...form, displayOrder: Number(order) }))} /></div>
        <label className="mt-3 block text-xs font-semibold text-slate-600">Bio<textarea className={`${inputClass} min-h-20`} value={staffForm.bio ?? ""} onChange={(event) => setStaffForm((form) => ({ ...form, bio: event.target.value }))} /></label>
        <div className="mt-3 grid gap-3 sm:grid-cols-2"><Field label="Photo URL" value={staffForm.imageUrl ?? ""} type="url" placeholder="https://..." onChange={(imageUrl) => setStaffForm((form) => ({ ...form, imageUrl }))} /><label className="block text-xs font-semibold text-slate-600">Or upload photo<input className={inputClass} type="file" accept="image/jpeg,image/png,image/webp" disabled={!!uploading} onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadMedia(file, "staff"); event.target.value = ""; }} /></label></div>
        <label className="mt-3 flex items-center gap-2 text-xs font-semibold text-slate-600"><input type="checkbox" checked={staffForm.isVisible} onChange={(event) => setStaffForm((form) => ({ ...form, isVisible: event.target.checked }))} /> Visible on landing page</label>
        <div className="mt-4 flex items-center gap-3"><button type="submit" disabled={saving || !!uploading} className="rounded-lg bg-[#004b37] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50">{saving ? "Saving..." : staffId ? "Save staff changes" : "Add staff member"}</button>{staffId && <button type="button" className={buttonClass} onClick={() => startStaff()}>Cancel editing</button>}{uploading === "staff" && <span className="text-xs text-slate-500">Uploading {progress}%</span>}</div>
      </form>
    </section>
    <section className="rounded-xl border border-[#e5ebe8] bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-bold text-[#17291f]">Student testimonials</h2><p className="text-xs text-slate-500">Manage written stories and playable student videos from the backend.</p></div><button type="button" className={buttonClass} onClick={() => startTestimonial()}>Add testimonial</button></div>
      <div className="mt-4 grid gap-3 lg:grid-cols-2">{testimonials.map((item) => <article key={item.id} className="rounded-lg border border-[#e5ebe8] p-3"><div className="flex gap-3">{mediaUrl(item.imageUrl) ? <Image unoptimized width={56} height={56} className="h-14 w-14 rounded-lg object-cover" src={mediaUrl(item.imageUrl)!} alt={item.studentName} /> : <div className="grid h-14 w-14 place-items-center rounded-lg bg-[#dff4e8] font-bold text-[#004b37]">{item.studentName.charAt(0)}</div>}<div className="min-w-0"><p className="text-sm font-bold text-[#17291f]">{item.studentName}</p><p className="text-xs text-slate-500">{item.type === "video" ? "Video" : "Written"}{item.course ? ` · ${item.course}` : ""}{item.score ? ` · ${item.score}` : ""}</p><p className={`text-[10px] font-semibold ${item.isVisible ? "text-emerald-700" : "text-slate-500"}`}>{item.isVisible ? "Visible" : "Hidden"}{item.isVerified ? " · Verified" : ""}</p></div></div><p className="mt-3 text-sm text-slate-600">{item.quote}</p>{item.type === "video" && mediaUrl(item.videoUrl) && <video className="mt-3 max-h-52 w-full rounded-lg bg-black" controls preload="metadata" src={mediaUrl(item.videoUrl)!} />}{item.type === "video" && !item.videoUrl && <p className="mt-2 text-xs text-amber-700">No video attached yet.</p>}<div className="mt-3 flex gap-3"><button type="button" className="text-xs font-semibold text-[#004b37]" onClick={() => startTestimonial(item)}>Edit</button><button type="button" disabled={saving} className="text-xs text-slate-600 disabled:opacity-50" onClick={() => void run(() => saveRecord(`/api/admin/content/testimonials/${item.id}`, "PUT", { isVisible: !item.isVisible }), item.isVisible ? "Testimonial hidden." : "Testimonial published.")}>{item.isVisible ? "Hide" : "Show"}</button></div></article>)}</div>{!testimonials.length && <p className="mt-4 text-sm text-slate-500">No testimonials yet.</p>}
      <form className="mt-5 rounded-lg bg-[#f5f7f6] p-4" onSubmit={(event) => { event.preventDefault(); if (uploading) return; void run(async () => { await saveRecord(testimonialId ? `/api/admin/content/testimonials/${testimonialId}` : "/api/admin/content/testimonials", testimonialId ? "PUT" : "POST", testimonialForm); startTestimonial(); }, testimonialId ? "Testimonial updated." : "Testimonial added."); }}>
        <h3 className="mb-3 text-sm font-bold text-[#17291f]">{testimonialId ? "Edit testimonial" : "New testimonial"}</h3>
        <div className="grid gap-3 sm:grid-cols-2"><Field label="Student name" value={testimonialForm.studentName} required onChange={(studentName) => setTestimonialForm((form) => ({ ...form, studentName }))} /><label className="block text-xs font-semibold text-slate-600">Story type<select className={inputClass} value={testimonialForm.type} onChange={(event) => setTestimonialForm((form) => ({ ...form, type: event.target.value as Testimonial["type"] }))}><option value="written">Written</option><option value="video">Video</option></select></label><Field label="Course" value={testimonialForm.course ?? ""} onChange={(course) => setTestimonialForm((form) => ({ ...form, course }))} /><Field label="School" value={testimonialForm.school ?? ""} onChange={(school) => setTestimonialForm((form) => ({ ...form, school }))} /><Field label="Score" value={testimonialForm.score ?? ""} onChange={(score) => setTestimonialForm((form) => ({ ...form, score }))} /><Field label="Display order" value={testimonialForm.displayOrder} type="number" onChange={(order) => setTestimonialForm((form) => ({ ...form, displayOrder: Number(order) }))} /></div>
        <label className="mt-3 block text-xs font-semibold text-slate-600">Quote<textarea className={`${inputClass} min-h-20`} value={testimonialForm.quote} required onChange={(event) => setTestimonialForm((form) => ({ ...form, quote: event.target.value }))} /></label>
        <div className="mt-3 grid gap-3 sm:grid-cols-2"><Field label="Student photo URL" value={testimonialForm.imageUrl ?? ""} type="url" placeholder="https://..." onChange={(imageUrl) => setTestimonialForm((form) => ({ ...form, imageUrl }))} /><label className="block text-xs font-semibold text-slate-600">Or upload photo<input className={inputClass} type="file" accept="image/jpeg,image/png,image/webp" disabled={!!uploading} onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadMedia(file, "student"); event.target.value = ""; }} /></label></div>
        {testimonialForm.type === "video" && <div className="mt-3 grid gap-3 sm:grid-cols-2"><Field label="Video URL" value={testimonialForm.videoUrl ?? ""} type="url" placeholder="https://..." onChange={(videoUrl) => setTestimonialForm((form) => ({ ...form, videoUrl }))} /><label className="block text-xs font-semibold text-slate-600">Or upload video<input className={inputClass} type="file" accept="video/mp4,video/webm" disabled={!!uploading} onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadMedia(file, "video"); event.target.value = ""; }} /></label><Field label="Duration label" value={testimonialForm.videoDuration ?? ""} placeholder="2:30" onChange={(videoDuration) => setTestimonialForm((form) => ({ ...form, videoDuration }))} /></div>}
        <div className="mt-3 flex flex-wrap gap-4"><label className="flex items-center gap-2 text-xs font-semibold text-slate-600"><input type="checkbox" checked={testimonialForm.isVerified} onChange={(event) => setTestimonialForm((form) => ({ ...form, isVerified: event.target.checked }))} /> Verified</label><label className="flex items-center gap-2 text-xs font-semibold text-slate-600"><input type="checkbox" checked={testimonialForm.isVisible} onChange={(event) => setTestimonialForm((form) => ({ ...form, isVisible: event.target.checked }))} /> Visible on landing page</label></div>
        <div className="mt-4 flex items-center gap-3"><button type="submit" disabled={saving || !!uploading} className="rounded-lg bg-[#004b37] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50">{saving ? "Saving..." : testimonialId ? "Save testimonial changes" : "Add testimonial"}</button>{testimonialId && <button type="button" className={buttonClass} onClick={() => startTestimonial()}>Cancel editing</button>}{uploading && uploading !== "staff" && <span className="text-xs text-slate-500">Uploading {progress}%</span>}</div>
      </form>
    </section>
  </div>;
}

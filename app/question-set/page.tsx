"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import DashboardContentLoading from "../componets/dashboard/DashboardContentLoading";
import {
  BookOpen,
  Download,
  Eye,
  FileText,
  Layers3,
  ListChecks,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  Upload,
} from "lucide-react";

interface QuestionSet {
  id: string;
  title: string;
  questionCount: number;
  totalPoints: number;
  isActive: boolean;
  createdAt: string;
  createdBy: { email: string };
}
type QuestionSetResponse = Omit<QuestionSet, "id"> & {
  id?: string;
  _id?: string;
};
const faculty = (title: string) =>
  /english|literature|government|history|islamic/i.test(title)
    ? "Arts & Humanities"
    : /economics|account|commerce|business/i.test(title)
      ? "Commercial & Social Sciences"
      : /biology|physics|chemistry|math/i.test(title)
        ? "Sciences & Medicine"
        : "General Core";
const iconTone = (title: string) =>
  /economics|account|commerce/i.test(title)
    ? "bg-[#fff0e3] text-[#a74408]"
    : /biology|chemistry|physics/i.test(title)
      ? "bg-[#edf4ef] text-[#004b37]"
      : "bg-[#f0f2f1] text-[#30453a]";

export default function ManageQuestionSets() {
  const [questionSets, setQuestionSets] = useState<QuestionSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeFaculty, setActiveFaculty] = useState("All disciplines");
  const [sort, setSort] = useState("newest");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [topicName, setTopicName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const refresh = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/questionset");
      const data = await response.json();
      if (data.success) {
        setQuestionSets(
          (data.questionSets || [])
            .map((set: QuestionSetResponse) => ({
              ...set,
              id: set.id || set._id || "",
            }))
            .filter((set: QuestionSet) => Boolean(set.id)),
        );
      }
    } catch (error) {
      console.error("Unable to load subjects", error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    refresh();
  }, []);
  const upload = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !file)
      return alert("Enter a subject title and choose a spreadsheet.");
    try {
      setUploading(true);
      const body = new FormData();
      body.append("title", title);
      body.append("topicName", topicName);
      body.append("file", file);
      const response = await fetch("/api/questionset/bulk-upload", {
        method: "POST",
        body,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Upload failed");
      setUploadOpen(false);
      setTitle("");
      setTopicName("");
      setFile(null);
      refresh();
    } catch (error) {
      alert(
        error instanceof Error ? error.message : "Could not upload subject",
      );
    } finally {
      setUploading(false);
    }
  };
  const remove = async (id: string) => {
    if (!confirm("Are you sure you want to delete this subject?")) return;
    try {
      const response = await fetch("/api/questionset/" + id, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Delete failed");
      refresh();
    } catch (error) {
      alert(
        error instanceof Error ? error.message : "Could not delete subject",
      );
    }
  };
  const toggle = async (id: string) => {
    try {
      const response = await fetch(
        "/api/questionset/" + id + "/toggle-active",
        { method: "PATCH" },
      );
      if (!response.ok) throw new Error("Update failed");
      refresh();
    } catch {
      alert("Could not update subject status");
    }
  };
  const subjects = useMemo(
    () =>
      questionSets
        .filter(
          (item) =>
            (activeFaculty === "All disciplines" ||
              faculty(item.title) === activeFaculty) &&
            item.title.toLowerCase().includes(search.toLowerCase()),
        )
        .sort((a, b) =>
          sort === "title"
            ? a.title.localeCompare(b.title)
            : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
    [questionSets, activeFaculty, search, sort],
  );
  const groups = [
    "All disciplines",
    ...Array.from(new Set(questionSets.map((item) => faculty(item.title)))),
  ];
  const totalQuestions = questionSets.reduce(
    (sum, item) => sum + item.questionCount,
    0,
  );

  return (
    <main className="min-h-screen bg-[#f5f7f6] px-4 pb-10 pt-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1440px]">
        <header className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            
            <h1 className="text-2xl font-bold tracking-tight text-[#091d15] sm:text-3xl">
              Question Bank &amp; Subjects Directory
            </h1>
            <p className="mt-1 max-w-xl text-sm leading-5 text-slate-500">
              Manage reusable subject question banks, organize questions by
              topic, and upload standardized curriculum questions with verified
              answer keys.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/question-organizer" className="inline-flex items-center gap-2 rounded-lg bg-[#e5eee7] px-4 py-2.5 text-xs font-semibold text-[#174a34] shadow-sm"><ListChecks className="h-4 w-4" /> Organize pasted questions</Link>
            <button
              onClick={() =>
                window.open("/api/questionset/template/download", "_blank")
              }
              className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-xs font-semibold text-[#24372d] shadow-sm ring-1 ring-[#e5ebe8]"
            >
              <Download className="h-4 w-4" /> Download Excel/CSV template
            </button>
            <button
              onClick={() => setUploadOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-[#a74408] px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-[#873807]"
            >
              <Upload className="h-4 w-4" /> Upload new subject
            </button>
          </div>
        </header>
        <section className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Stat
            label="Total active disciplines"
            value={loading ? "—" : questionSets
              .filter((item) => item.isActive)
              .length.toString()}
            noun="Subjects"
            icon={<BookOpen />}
            tone="slate"
          />
          <Stat
            label="Total question pool"
            value={loading ? "—" : totalQuestions.toLocaleString()}
            noun="Questions"
            icon={<FileText />}
            tone="orange"
          />
          <Stat
            label="Topic-based banks"
            value={loading ? "—" : questionSets.length.toString()}
            noun="Subject banks"
            icon={<Layers3 />}
            tone="mint"
          />
          <article className="rounded-xl bg-[#003d2e] p-4 text-white shadow-sm">
            <div className="mb-5 flex items-center justify-between text-[10px] font-bold uppercase tracking-[.13em] text-[#ffad4c]">
              UTME syllabus index <ShieldCheck className="h-4 w-4" />
            </div>
            <p className="text-2xl font-bold">
              99.4%{" "}
              <span className="text-xs font-medium text-[#ffbf76]">
                Compliant
              </span>
            </p>
            <p className="mt-1 text-xs text-white/65">
              Biometric randomized protocol armed
            </p>
          </article>
        </section>
        <section className="rounded-xl border border-[#e5ebe8] bg-white p-3 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row">
            <label className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search subjects by title, faculty code, or keyword…"
                className="w-full rounded-lg bg-[#f3f5f4] py-2.5 pl-9 pr-3 text-xs outline-none focus:ring-2 focus:ring-[#004b37]/20"
              />
            </label>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value)}
              className="rounded-lg bg-[#f3f5f4] px-3 py-2.5 text-xs text-[#263a30] outline-none"
            >
              <option value="newest">Sort: Last updated (Newest)</option>
              <option value="title">Sort: Subject title</option>
            </select>
            <button
              className="grid place-items-center rounded-lg bg-[#f3f5f4] px-3 text-slate-600"
              aria-label="Directory filters"
            >
              <SlidersHorizontal className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto border-t border-slate-100 pt-3">
            {groups.map((group) => (
              <button
                key={group}
                onClick={() => setActiveFaculty(group)}
                className={
                  "shrink-0 rounded px-3 py-2 text-[11px] font-medium " +
                  (activeFaculty === group
                    ? "bg-[#004b37] text-white"
                    : "bg-[#f3f5f4] text-slate-600 hover:bg-[#edf4ef]")
                }
              >
                {group} (
                {loading ? "—" : group === "All disciplines"
                  ? questionSets.length
                  : questionSets.filter((item) => faculty(item.title) === group)
                      .length}
                )
              </button>
            ))}
          </div>
        </section>
        {loading ? (
          <DashboardContentLoading label="Loading subjects" cards={6} />
        ) : (
          <section className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {subjects.map((subject) => (
              <article
                key={subject.id}
                className="rounded-xl border border-[#e5ebe8] bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="flex gap-3">
                    <span
                      className={
                        "grid h-9 w-9 place-items-center rounded-lg " +
                        iconTone(subject.title)
                      }
                    >
                      <BookOpen className="h-4 w-4" />
                    </span>
                    <div>
                      <h2 className="text-base font-semibold text-[#11231a]">
                        {subject.title}
                      </h2>
                      <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[.13em] text-[#a74408]">
                        {faculty(subject.title)}
                      </p>
                    </div>
                  </div>
                  <span
                    className={
                      "rounded-full px-2 py-1 text-[9px] font-bold " +
                      (subject.isActive
                        ? "bg-[#cef3e1] text-[#176148]"
                        : "bg-slate-100 text-slate-500")
                    }
                  >
                    {subject.isActive ? "• Active" : "Inactive"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 rounded-lg bg-[#f1f3f2] p-3 text-xs text-slate-600">
                  <p>
                    Question Bank
                    <br />
                    <b className="text-[#16271f]">
                      {subject.questionCount} questions
                    </b>
                  </p>
                  <p>
                    Grading Weight
                    <br />
                    <b className="text-[#16271f]">
                      {subject.totalPoints} points
                    </b>
                  </p>
                  <p>
                    Configured
                    <br />
                    <b className="text-[#16271f]">
                      {new Date(subject.createdAt).toLocaleDateString()}
                    </b>
                  </p>
                  <p>
                    Curator
                    <br />
                    <b className="block truncate text-[#16271f]">
                      {subject.createdBy?.email || "Portal admin"}
                    </b>
                  </p>
                </div>
                <div className="mt-4 flex gap-2">
                  <Link
                    href={"/question-set/" + subject.id}
                    className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg bg-[#004b37] px-3 py-2 text-xs font-semibold text-white"
                  >
                    <Eye className="h-3.5 w-3.5" /> Manage topics
                  </Link>
                  <button
                    onClick={() => toggle(subject.id)}
                    className="rounded-lg bg-[#f1f3f2] px-3 py-2 text-xs font-medium text-[#2f4037]"
                  >
                    {subject.isActive ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    onClick={() => remove(subject.id)}
                    className="rounded-lg px-2 text-red-600 hover:bg-red-50"
                    aria-label={"Delete " + subject.title}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </article>
            ))}
          </section>
        )}
        {!loading && !subjects.length && (
          <section className="mt-5 rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <BookOpen className="mx-auto mb-3 h-8 w-8 text-slate-400" />
            <h2 className="font-semibold text-[#1b2d24]">
              No subjects match this directory view
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Try another search term, or upload a new subject bank.
            </p>
          </section>
        )}
        <section className="mt-5 flex flex-col gap-3 rounded-xl bg-[#004b37] p-4 text-white sm:flex-row sm:items-center">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-white/10">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div className="flex-1">
            <h2 className="font-semibold">
              Syndicate Examination Proctor Lock · Armed
            </h2>
            <p className="text-xs text-white/65">
              Candidate session instances are generated dynamically with
              anti-collusion question shuffles.
            </p>
          </div>
          <button className="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-[#004b37]">
            Export syllabus map
          </button>
        </section>
        {uploadOpen && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/55 p-4">
            <form
              onSubmit={upload}
              className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl"
            >
              <h2 className="text-xl font-bold text-[#13241c]">
                Upload new subject
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Create a subject and its first topic from the approved
                spreadsheet template.
              </p>
              <label className="mt-5 block text-xs font-semibold text-slate-600">
                Subject title
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#004b37]"
                  required
                />
              </label>
              <label className="mt-4 block text-xs font-semibold text-slate-600">
                First topic
                <input
                  value={topicName}
                  onChange={(event) => setTopicName(event.target.value)}
                  placeholder="e.g. Algebra"
                  className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#004b37]"
                  required
                />
              </label>
              <label className="mt-4 block text-xs font-semibold text-slate-600">
                Excel or CSV file
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={(event) => setFile(event.target.files?.[0] || null)}
                  className="mt-1.5 block w-full text-xs"
                  required
                />
              </label>
              <div className="mt-6 flex gap-2">
                <button
                  type="button"
                  onClick={() => setUploadOpen(false)}
                  className="flex-1 rounded-lg bg-[#f2f4f3] py-2.5 text-sm font-semibold text-[#33463a]"
                >
                  Cancel
                </button>
                <button
                  disabled={uploading}
                  className="flex-1 rounded-lg bg-[#a74408] py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {uploading ? "Uploading…" : "Upload subject"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}
function Stat({
  label,
  value,
  noun,
  icon,
  tone,
}: {
  label: string;
  value: string;
  noun: string;
  icon: React.ReactNode;
  tone: "slate" | "orange" | "mint";
}) {
  const colors = {
    slate: "bg-[#edf0ef] text-[#42544b]",
    orange: "bg-[#fff0e3] text-[#a74408]",
    mint: "bg-[#e7f5ed] text-[#004b37]",
  };
  return (
    <article className="rounded-xl border border-[#e5ebe8] bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <p className="max-w-[110px] text-[10px] font-bold uppercase tracking-[.13em] text-slate-600">
          {label}
        </p>
        <span
          className={
            "grid h-9 w-9 place-items-center rounded-lg " + colors[tone]
          }
        >
          {icon}
        </span>
      </div>
      <p className="mt-4 text-2xl font-bold text-[#0b1e15]">
        {value} <span className="text-lg">{noun}</span>
      </p>
      <p className="mt-1 text-[11px] text-[#176148]">
        ↑ Current academic cycle
      </p>
    </article>
  );
}

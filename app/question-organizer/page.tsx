"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  FileText,
  FolderPlus,
  ListChecks,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import { DraftQuestion, parseQuestions, validateDraft } from "./parseQuestions";

type Subject = { id: string; title: string };
type Topic = { id: string; name: string; isActive: boolean };

const field =
  "w-full rounded-lg border border-[#d9e2dc] bg-white px-3 py-2.5 text-sm text-[#132b20] outline-none focus:border-[#1c7151] focus:ring-2 focus:ring-[#1c7151]/15";
const label =
  "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#496254]";
const letters = ["A", "B", "C", "D"] as const;

export default function QuestionOrganizer() {
  const [raw, setRaw] = useState("");
  const [questions, setQuestions] = useState<DraftQuestion[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectId, setSubjectId] = useState("");
  const [title, setTitle] = useState("");
  const [existingTopics, setExistingTopics] = useState<Topic[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [bulkTopic, setBulkTopic] = useState("");
  const [rangeStart, setRangeStart] = useState("");
  const [rangeEnd, setRangeEnd] = useState("");
  const [filterTopic, setFilterTopic] = useState("all");
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{
    id: string;
    count: number;
    topics: string[];
    warning?: string;
  } | null>(null);
  const [partialId, setPartialId] = useState("");

  useEffect(() => {
    const selectedSubject = new URLSearchParams(window.location.search).get(
      "subjectId",
    );
    if (selectedSubject) setSubjectId(selectedSubject);
    fetch("/api/questionset", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok)
          throw new Error(data.message || "Could not load subjects");
        setSubjects(
          (data.questionSets || [])
            .map((item: Subject & { _id?: string }) => ({
              id: item.id || item._id || "",
              title: item.title,
            }))
            .filter((item: Subject) => item.id),
        );
      })
      .catch((reason) =>
        setError(
          reason instanceof Error ? reason.message : "Could not load subjects",
        ),
      );
  }, []);

  useEffect(() => {
    if (!subjectId) {
      setExistingTopics([]);
      return;
    }
    fetch(`/api/questionset/${subjectId}/topics`, { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok)
          throw new Error(data.message || "Could not load topics");
        setExistingTopics(data.topics || []);
      })
      .catch((reason) =>
        setError(
          reason instanceof Error ? reason.message : "Could not load topics",
        ),
      );
  }, [subjectId]);

  const topicNames = useMemo(
    () =>
      Array.from(
        new Set([
          ...existingTopics
            .filter((topic) => topic.isActive)
            .map((topic) => topic.name),
          ...questions.map((question) => question.topic).filter(Boolean),
        ]),
      ).sort((a, b) => a.localeCompare(b)),
    [existingTopics, questions],
  );
  const invalid = questions.reduce(
    (count, question) => count + (validateDraft(question).length ? 1 : 0),
    0,
  );
  const visible = questions
    .map((question, index) => ({ question, index }))
    .filter(
      ({ question }) =>
        filterTopic === "all" ||
        (filterTopic === "unassigned"
          ? !question.topic
          : question.topic === filterTopic),
    );
  const grouped = useMemo(() => {
    const counts = new Map<string, number>();
    questions.forEach((question) =>
      counts.set(
        question.topic.trim() || "Unassigned",
        (counts.get(question.topic.trim() || "Unassigned") || 0) + 1,
      ),
    );
    return [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [questions]);

  const update = (index: number, change: Partial<DraftQuestion>) => {
    setQuestions((current) =>
      current.map((question, position) =>
        position === index ? { ...question, ...change } : question,
      ),
    );
    setSuccess(null);
  };
  const parse = () => {
    const result = parseQuestions(raw);
    setQuestions(result.questions);
    setWarnings(result.warnings);
    setSelected([]);
    setFilterTopic("all");
    setError("");
    setSuccess(null);
  };
  const readFile = async (file?: File) => {
    if (!file) return;
    setLoading(true);
    try {
      const text = await file.text();
      setRaw(text);
      const result = parseQuestions(text);
      setQuestions(result.questions);
      setWarnings(result.warnings);
      setSelected([]);
      setError("");
      setSuccess(null);
    } catch {
      setError("Could not read this text file");
    } finally {
      setLoading(false);
    }
  };
  const toggleSelected = (index: number) =>
    setSelected((current) =>
      current.includes(index)
        ? current.filter((item) => item !== index)
        : [...current, index],
    );
  const selectRange = () => {
    const start = Number(rangeStart);
    const end = Number(rangeEnd);
    if (
      !Number.isInteger(start) ||
      !Number.isInteger(end) ||
      start < 1 ||
      end < start
    )
      return setError("Enter a valid question number range.");
    const matches = questions
      .map((question, index) => ({ question, index }))
      .filter(
        ({ question }) =>
          question.sourceNumber >= start && question.sourceNumber <= end,
      )
      .map(({ index }) => index);
    if (!matches.length)
      return setError("No parsed questions match that range.");
    setSelected(matches);
    setError("");
  };
  const applyTopic = () => {
    const name = bulkTopic.trim();
    if (!name || !selected.length) return;
    setQuestions((current) =>
      current.map((question, index) =>
        selected.includes(index) ? { ...question, topic: name } : question,
      ),
    );
    setSelected([]);
    setBulkTopic("");
    setSuccess(null);
  };
  const remove = (index: number) => {
    setQuestions((current) =>
      current.filter((_, position) => position !== index),
    );
    setSelected((current) =>
      current
        .filter((item) => item !== index)
        .map((item) => (item > index ? item - 1 : item)),
    );
    setSuccess(null);
  };

  const publish = async () => {
    setError("");
    setPartialId("");
    if (!subjectId && !title.trim())
      return setError(
        "Choose an existing subject or enter a new subject name.",
      );
    if (!questions.length)
      return setError("Parse or add questions before publishing.");
    if (invalid)
      return setError(
        `Review the ${invalid} incomplete question${invalid === 1 ? "" : "s"} before publishing.`,
      );
    const inactive = questions.find((question) =>
      existingTopics.some(
        (topic) =>
          topic.name.toLowerCase() === question.topic.toLowerCase() &&
          !topic.isActive,
      ),
    );
    if (inactive)
      return setError(
        `Topic "${inactive.topic}" is inactive. Choose another topic or reactivate it.`,
      );
    try {
      setPublishing(true);
      const response = await fetch("/api/questionset/topics/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionSetId: subjectId || undefined,
          title: title.trim(),
          questions,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        if (data.partial?.id && Array.isArray(data.partial.publishedIndices)) {
          const published = new Set<number>(data.partial.publishedIndices);
          setQuestions((current) => current.filter((_, index) => !published.has(index)));
          setSubjectId(data.partial.id);
          setPartialId(data.partial.id);
          setSelected([]);
          setTitle("");
        }
        throw new Error(data.message || "Could not publish questions");
      }
      setSuccess({ id: data.id, count: data.count, topics: data.topics, warning: data.warning });
      setQuestions([]);
      setSelected([]);
      setRaw("");
      setWarnings([]);
      if (!subjectId) {
        setSubjectId(data.id);
        setSubjects((current) => [
          { id: data.id, title: title.trim() },
          ...current,
        ]);
        setTitle("");
      }
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Could not publish questions",
      );
    } finally {
      setPublishing(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f5f7f6] px-4 py-6 text-[#142b1f] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1450px]">
        <Link
          href="/question-set"
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-[#436251] hover:text-[#064f37]"
        >
          <ArrowLeft className="h-4 w-4" /> BACK
        </Link>
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.18em] text-[#a44b0b]">
              Question bank tool
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">
              Organize &amp; import questions
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-[#587063]">
              Paste numbered questions, review their answers, assign topics,
              then publish them to a subject in one upload.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-[#dce6df] bg-white px-4 py-3 text-sm text-[#41604c]">
            <ListChecks className="h-5 w-5 text-[#136747]" />
            <span>
              {questions.length} parsed · {invalid} need review
            </span>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          >
            {error}
            {partialId && <Link href={`/question-set/${partialId}`} className="ml-2 font-semibold underline">View published questions</Link>}
          </div>
        )}
        {success && (
          <div
            role="status"
            className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
          >
            <span>
              <Check className="mr-2 inline h-4 w-4" />
              Published {success.count} questions across {success.topics.length}{" "}
              topics.
              {success.warning && <span className="mt-1 block font-medium text-amber-800">{success.warning}</span>}
            </span>
            <Link
              href={`/question-set/${success.id}`}
              className="font-semibold underline"
            >
              View subject
            </Link>
          </div>
        )}

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_330px]">
          <div className="min-w-0 space-y-5">
            <section className="rounded-2xl border border-[#e0e9e2] bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-4 flex items-start gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#e8f4ec] text-[#0d6242]">
                  <FileText className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-lg font-bold">1. Add source questions</h2>
                  <p className="text-sm text-[#65776c]">
                    Use the format shown below. Topic headings are optional.
                  </p>
                </div>
              </div>
              <textarea
                aria-label="Question source text"
                value={raw}
                onChange={(event) => setRaw(event.target.value)}
                rows={10}
                placeholder={
                  "Topic: Mechanics\n1. What is the extension?\nA. 1 cm\nB. 2 cm\nC. 3 cm\nD. 4 cm\nCorrect Answer: C\nExplanation: Hooke’s law gives 3 cm."
                }
                className={`${field} resize-y font-mono leading-6`}
              />
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={parse}
                  disabled={!raw.trim()}
                  className="rounded-lg bg-[#064e37] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                >
                  Parse questions
                </button>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#d7e1da] px-4 py-2.5 text-sm font-semibold">
                  <Upload className="h-4 w-4" /> Import .txt file
                  <input
                    type="file"
                    accept=".txt,text/plain"
                    className="sr-only"
                    onChange={(event) => readFile(event.target.files?.[0])}
                  />
                </label>
                {loading && (
                  <span className="text-sm text-[#627467]">Reading…</span>
                )}
              </div>
              {warnings.length > 0 && (
                <div
                  role="status"
                  className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"
                >
                  <p className="font-semibold">Parser notes</p>
                  <ul className="mt-1 list-disc pl-5">
                    {warnings.slice(0, 8).map((warning, index) => (
                      <li key={index}>{warning}</li>
                    ))}
                    {warnings.length > 8 && (
                      <li>And {warnings.length - 8} more notes.</li>
                    )}
                  </ul>
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-[#e0e9e2] bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold">2. Review &amp; group</h2>
                  <p className="text-sm text-[#65776c]">
                    Select several questions to give them the same topic, or
                    edit each one.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setQuestions((current) => [
                      ...current,
                      {
                        sourceNumber: current.length + 1,
                        question: "",
                        options: ["", "", "", ""],
                        correctLetter: "",
                        explanation: "",
                        topic: "",
                      },
                    ])
                  }
                  className="inline-flex items-center gap-1 rounded-lg border border-[#d7e1da] px-3 py-2 text-sm font-semibold"
                >
                  <Plus className="h-4 w-4" /> Add question
                </button>
              </div>
              {questions.length > 0 && (
                <div className="mb-5 rounded-xl bg-[#f4f8f5] p-4">
                  <div className="mb-4 flex flex-wrap items-end gap-3">
                    <label className="flex items-center gap-2 pb-2 text-sm font-medium">
                      <input
                        type="checkbox"
                        checked={
                          visible.length > 0 &&
                          visible.every(({ index }) => selected.includes(index))
                        }
                        onChange={(event) =>
                          setSelected((current) =>
                            event.target.checked
                              ? Array.from(
                                  new Set([
                                    ...current,
                                    ...visible.map(({ index }) => index),
                                  ]),
                                )
                              : current.filter(
                                  (index) =>
                                    !visible.some(
                                      (item) => item.index === index,
                                    ),
                                ),
                          )
                        }
                      />{" "}
                      Select shown ({visible.length})
                    </label>
                    <div className="flex items-end gap-2">
                      <div>
                        <label className={label} htmlFor="range-start">
                          From #
                        </label>
                        <input
                          id="range-start"
                          type="number"
                          min="1"
                          className={`${field} w-20`}
                          value={rangeStart}
                          onChange={(event) =>
                            setRangeStart(event.target.value)
                          }
                        />
                      </div>
                      <div>
                        <label className={label} htmlFor="range-end">
                          To #
                        </label>
                        <input
                          id="range-end"
                          type="number"
                          min="1"
                          className={`${field} w-20`}
                          value={rangeEnd}
                          onChange={(event) => setRangeEnd(event.target.value)}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={selectRange}
                        className="rounded-lg border border-[#d7e1da] bg-white px-3 py-2.5 text-sm font-semibold"
                      >
                        Select range
                      </button>
                    </div>
                  </div>
                  <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                    <div>
                      <label className={label} htmlFor="bulk-topic">
                        Topic for selected questions
                      </label>
                      <input
                        id="bulk-topic"
                        className={field}
                        list="topic-suggestions"
                        placeholder="Choose or type a topic"
                        value={bulkTopic}
                        onChange={(event) => setBulkTopic(event.target.value)}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={applyTopic}
                      disabled={!selected.length || !bulkTopic.trim()}
                      className="rounded-lg bg-[#e6eee7] px-4 py-2.5 text-sm font-semibold text-[#164c33] disabled:opacity-50"
                    >
                      Assign {selected.length || ""} selected
                    </button>
                  </div>
                </div>
              )}
              {questions.length > 0 && (
                <div className="mb-4 flex items-center gap-2 text-sm">
                  <label htmlFor="filter-topic" className="font-medium">
                    Show
                  </label>
                  <select
                    id="filter-topic"
                    className="rounded-lg border border-[#d9e2dc] bg-white px-3 py-2"
                    value={filterTopic}
                    onChange={(event) => setFilterTopic(event.target.value)}
                  >
                    <option value="all">All questions</option>
                    <option value="unassigned">Unassigned</option>
                    {topicNames.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <datalist id="topic-suggestions">
                {topicNames.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
              {questions.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#cad8cd] px-6 py-12 text-center text-sm text-[#678071]">
                  Parsed questions will appear here for review.
                </div>
              ) : visible.length === 0 ? (
                <div className="py-10 text-center text-sm text-[#678071]">
                  No questions match this topic.
                </div>
              ) : (
                <div className="space-y-4">
                  {visible.map(({ question, index }) => {
                    const problems = validateDraft(question);
                    return (
                      <article
                        key={index}
                        className={`rounded-xl border p-4 sm:p-5 ${problems.length ? "border-amber-300 bg-amber-50/30" : "border-[#dfe8e1] bg-white"}`}
                      >
                        <div className="mb-4 flex flex-wrap items-center gap-3">
                          <input
                            aria-label={`Select question ${question.sourceNumber}`}
                            type="checkbox"
                            checked={selected.includes(index)}
                            onChange={() => toggleSelected(index)}
                          />
                          <span className="rounded-md bg-[#e9f1eb] px-2 py-1 text-xs font-bold text-[#14583c]">
                            #{question.sourceNumber}
                          </span>
                          <span className="min-w-0 flex-1 text-xs text-[#65776c]">
                            {question.topic || "Unassigned topic"}
                          </span>
                          <button
                            type="button"
                            onClick={() => remove(index)}
                            aria-label={`Remove question ${question.sourceNumber}`}
                            className="rounded-lg p-2 text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="grid gap-4">
                          <div>
                            <label className={label}>Question</label>
                            <textarea
                              className={field}
                              rows={2}
                              value={question.question}
                              onChange={(event) =>
                                update(index, { question: event.target.value })
                              }
                            />
                          </div>
                          <div className="grid gap-3 sm:grid-cols-2">
                            {letters.map((letter, optionIndex) => (
                              <div key={letter}>
                                <label className={label}>Option {letter}</label>
                                <input
                                  className={field}
                                  value={question.options[optionIndex]}
                                  onChange={(event) => {
                                    const options = [
                                      ...question.options,
                                    ] as DraftQuestion["options"];
                                    options[optionIndex] = event.target.value;
                                    update(index, { options });
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                              <label className={label}>Correct answer</label>
                              <select
                                className={field}
                                value={question.correctLetter}
                                onChange={(event) =>
                                  update(index, {
                                    correctLetter: event.target
                                      .value as DraftQuestion["correctLetter"],
                                  })
                                }
                              >
                                <option value="">Choose answer</option>
                                {letters.map((letter) => (
                                  <option key={letter} value={letter}>
                                    {letter}
                                    {question.options[letters.indexOf(letter)]
                                      ? ` · ${question.options[letters.indexOf(letter)].slice(0, 55)}`
                                      : ""}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className={label}>Topic</label>
                              <input
                                className={field}
                                list="topic-suggestions"
                                placeholder="e.g. Mechanics"
                                value={question.topic}
                                onChange={(event) =>
                                  update(index, { topic: event.target.value })
                                }
                              />
                            </div>
                          </div>
                          <div>
                            <label className={label}>
                              Explanation (optional)
                            </label>
                            <textarea
                              className={field}
                              rows={2}
                              value={question.explanation}
                              onChange={(event) =>
                                update(index, {
                                  explanation: event.target.value,
                                })
                              }
                            />
                          </div>
                        </div>
                        {problems.length > 0 && (
                          <p className="mt-3 text-xs font-medium text-amber-800">
                            {problems.join(" · ")}
                          </p>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          <aside className="space-y-5 xl:sticky xl:top-5 xl:self-start">
            <section className="rounded-2xl border border-[#e0e9e2] bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <FolderPlus className="h-5 w-5 text-[#0d6242]" />
                <h2 className="text-lg font-bold">3. Publish destination</h2>
              </div>
              <label className={label} htmlFor="subject">
                Subject
              </label>
              <select
                id="subject"
                className={field}
                value={subjectId}
                onChange={(event) => {
                  setSubjectId(event.target.value);
                  setError("");
                }}
              >
                <option value="">Create a new subject</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.title}
                  </option>
                ))}
              </select>
              {!subjectId && (
                <div className="mt-4">
                  <label className={label} htmlFor="new-title">
                    New subject name
                  </label>
                  <input
                    id="new-title"
                    className={field}
                    placeholder="e.g. Physics"
                    value={title}
                    maxLength={255}
                    onChange={(event) => setTitle(event.target.value)}
                  />
                </div>
              )}
              <p className="mt-4 text-xs leading-5 text-[#67796d]">
                New topic names are created automatically in the selected
                subject. Existing active topics are reused.
              </p>
            </section>
            <section className="rounded-2xl border border-[#e0e9e2] bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold">Topic summary</h2>
              {grouped.length ? (
                <ul className="mt-4 space-y-2">
                  {grouped.map(([name, count]) => (
                    <li
                      key={name}
                      className="flex justify-between gap-3 rounded-lg bg-[#f5f8f5] px-3 py-2 text-sm"
                    >
                      <span
                        className={
                          name === "Unassigned" ? "text-amber-700" : ""
                        }
                      >
                        {name}
                      </span>
                      <strong>{count}</strong>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-[#697c70]">No questions yet.</p>
              )}
              <div className="mt-5 border-t border-[#e5ece6] pt-4 text-sm">
                <div className="flex justify-between">
                  <span>Total questions</span>
                  <strong>{questions.length}</strong>
                </div>
                <div className="mt-2 flex justify-between">
                  <span>Need review</span>
                  <strong
                    className={invalid ? "text-amber-700" : "text-[#176747]"}
                  >
                    {invalid}
                  </strong>
                </div>
              </div>
              <button
                type="button"
                onClick={publish}
                disabled={publishing || !questions.length || invalid > 0}
                className="mt-5 w-full rounded-lg bg-[#a34b0a] px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {publishing
                  ? "Publishing…"
                  : `Publish ${questions.length} questions`}
              </button>
              <p className="mt-3 text-xs leading-5 text-[#67796d]">
                All questions are checked before upload. If any question fails,
                nothing is saved.
              </p>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}

"use client";

import { ArrowLeft } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import QuizSettingsComponent from "../componets/QuizSettings";
import QuestionSetsSelector, {
  QuestionSet,
  SubjectSelection,
  Topic,
} from "../componets/QuestionSetsSelector";
import { QuizSettings } from "../types/global";
import {
  readExamDrafts,
  removeExamDraft,
  saveExamDraft,
} from "../lib/examDrafts";

type ExamType = "multi-subject" | "single-subject";

interface CreateQuizClientProps {
  user?: unknown;
}

const emptySelection = (): SubjectSelection => ({
  questionSetId: null,
  topicSelections: [],
});

export default function CreateQuizClient({}: CreateQuizClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"details" | "question-sets">(
    "details",
  );
  const [examType, setExamType] = useState<ExamType>("multi-subject");
  const [settings, setSettings] = useState<QuizSettings>({
    coverImage: "",
    title: "",
    description: "",
    instructions: "",
    isQuizChallenge: false,
    isOpenQuiz: false,
    duration: { hours: 0, minutes: 30, seconds: 0 },
    shuffleQuestions: true,
    multipleAttempts: true,
    requireLogin: true,
    permitLoseFocus: true,
    viewAnswer: true,
    viewResults: true,
    displayCalculator: false,
  });
  const [selections, setSelections] = useState<SubjectSelection[]>([
    emptySelection(),
    emptySelection(),
    emptySelection(),
    emptySelection(),
  ]);
  const [availableQuestionSets, setAvailableQuestionSets] = useState<
    QuestionSet[]
  >([]);
  const [topicsByQuestionSet, setTopicsByQuestionSet] = useState<
    Record<string, Topic[]>
  >({});
  const [isLoadingQuestionSets, setIsLoadingQuestionSets] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [draftId, setDraftId] = useState<string | null>(null);
  const [draftNotice, setDraftNotice] = useState("");

  const expectedCount = examType === "single-subject" ? 1 : 4;
  const fetchQuestionSets = async () => {
    try {
      setIsLoadingQuestionSets(true);
      const response = await fetch("/api/questionset", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Failed to load subjects");
      setAvailableQuestionSets(
        (data.questionSets || []).map(
          (set: QuestionSet & { _id?: string }) => ({
            ...set,
            id: set.id || set._id || "",
          }),
        ),
      );
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Failed to load subjects",
      );
    } finally {
      setIsLoadingQuestionSets(false);
    }
  };

  const fetchTopics = async (questionSetId: string) => {
    const response = await fetch(`/api/questionset/${questionSetId}/topics`, {
      cache: "no-store",
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to load topics");
    const topics = (data.topics || []).map(
      (topic: Topic & { _id?: string }) => ({
        ...topic,
        id: topic.id || topic._id || "",
      }),
    );
    setTopicsByQuestionSet((current) => ({
      ...current,
      [questionSetId]: topics,
    }));
    return topics;
  };

  useEffect(() => {
    void fetchQuestionSets();
    const requestedDraftId = new URLSearchParams(window.location.search).get(
      "draft",
    );
    if (!requestedDraftId) return;

    const draft = readExamDrafts().find((item) => item.id === requestedDraftId);
    if (!draft) {
      setError("This draft is no longer available in this browser.");
      return;
    }

    setDraftId(draft.id);
    setExamType(draft.examType);
    setSettings(draft.settings);
    const count = draft.examType === "single-subject" ? 1 : 4;
    const restored = Array.from(
      { length: count },
      (_, index) => draft.selections[index] || emptySelection(),
    );
    setSelections(restored);
    setDraftNotice(
      "Draft loaded. Your changes are saved only when you select Save draft.",
    );
    void Promise.all(
      [
        ...new Set(
          restored
            .map((selection) => selection.questionSetId)
            .filter((id): id is string => Boolean(id)),
        ),
      ].map(fetchTopics),
    ).catch((reason) =>
      setError(
        reason instanceof Error
          ? reason.message
          : "Failed to load draft topics",
      ),
    );
  }, []);

  const changeExamType = (type: ExamType) => {
    if (type === examType) return;
    setExamType(type);
    setSelections(
      Array.from({ length: type === "single-subject" ? 1 : 4 }, emptySelection),
    );
    setError("");
    setDraftNotice("");
  };

  const saveDraft = () => {
    try {
      const id = draftId || crypto.randomUUID();
      saveExamDraft({
        id,
        updatedAt: new Date().toISOString(),
        examType,
        settings,
        selections,
      });
      setDraftId(id);
      window.history.replaceState(
        null,
        "",
        `/create-quiz?draft=${encodeURIComponent(id)}`,
      );
      setDraftNotice("Draft saved in this browser.");
      setError("");
    } catch {
      setError(
        "Unable to save this draft in this browser. Check that browser storage is available.",
      );
    }
  };

  const changeSelection = (
    index: number,
    change: (selection: SubjectSelection) => SubjectSelection,
  ) => {
    setDraftNotice("");
    setSelections((current) =>
      current.map((selection, itemIndex) =>
        itemIndex === index ? change(selection) : selection,
      ),
    );
  };

  const handleQuestionSetChange = async (
    index: number,
    questionSetId: string | null,
  ) => {
    changeSelection(index, () => ({ questionSetId, topicSelections: [] }));
    if (!questionSetId || topicsByQuestionSet[questionSetId]) return;
    try {
      await fetchTopics(questionSetId);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Failed to load topics",
      );
    }
  };

  const addTopic = (index: number) =>
    changeSelection(index, (selection) => ({
      ...selection,
      topicSelections: [
        ...selection.topicSelections,
        { topicId: "", questionCount: 0, questionIds: [] },
      ],
    }));
  const changeTopic = (index: number, topicIndex: number, topicId: string) =>
    changeSelection(index, (selection) => ({
      ...selection,
      topicSelections: selection.topicSelections.map((topic, itemIndex) =>
        itemIndex === topicIndex
          ? { ...topic, topicId, questionCount: 0 }
          : topic,
      ),
    }));
  const changeQuestionCount = (
    index: number,
    topicIndex: number,
    questionCount: number,
  ) =>
    changeSelection(index, (selection) => ({
      ...selection,
      topicSelections: selection.topicSelections.map((topic, itemIndex) =>
        itemIndex === topicIndex ? { ...topic, questionCount } : topic,
      ),
    }));
  const removeTopic = (index: number, topicIndex: number) =>
    changeSelection(index, (selection) => ({
      ...selection,
      topicSelections: selection.topicSelections.filter(
        (_, itemIndex) => itemIndex !== topicIndex,
      ),
    }));

  const validationError = useMemo(() => {
    if (!settings.title.trim()) return "Exam title is required.";
    if (selections.some((selection) => !selection.questionSetId))
      return `Select all ${expectedCount} subject${expectedCount === 1 ? "" : "s"}.`;
    if (
      new Set(selections.map((selection) => selection.questionSetId)).size !==
      expectedCount
    )
      return "Each subject may be selected only once.";
    for (const selection of selections) {
      const setId = selection.questionSetId!;
      const topics = topicsByQuestionSet[setId];
      if (!topics) return "Topics are still loading. Please wait a moment.";
      if (topics.filter((topic) => topic.isActive).length === 0) continue; // Legacy bank: preserve its complete pool.
      if (!selection.topicSelections.length)
        return "Select at least one topic for every topic-based subject.";
      const used = new Set<string>();
      for (const choice of selection.topicSelections) {
        const topic = topics.find(
          (item) => item.id === choice.topicId && item.isActive,
        );
        if (!topic || used.has(choice.topicId))
          return "Choose a different active topic for each topic row.";
        const available = topic._count?.questions ?? 0;
        if (
          !Number.isInteger(choice.questionCount) ||
          choice.questionCount < 1 ||
          choice.questionCount > available
        )
          return `Choose between 1 and ${available} questions for ${topic.name}.`;
        used.add(choice.topicId);
      }
    }
    return "";
  }, [expectedCount, selections, settings.title, topicsByQuestionSet]);

  const stats = useMemo(
    () =>
      selections.reduce(
        (total, selection) => {
          const set = availableQuestionSets.find(
            (item) => item.id === selection.questionSetId,
          );
          const hasTopics =
            selection.questionSetId &&
            (topicsByQuestionSet[selection.questionSetId] || []).some(
              (topic) => topic.isActive,
            );
          return {
            subjects: total.subjects + (set ? 1 : 0),
            questions:
              total.questions +
              (hasTopics
                ? selection.topicSelections.reduce(
                    (sum, topic) => sum + (topic.questionCount || 0),
                    0,
                  )
                : set?.questionCount || 0),
            points: total.points + (hasTopics ? 0 : set?.totalPoints || 0),
          };
        },
        { subjects: 0, questions: 0, points: 0 },
      ),
    [availableQuestionSets, selections, topicsByQuestionSet],
  );

  const submit = async () => {
    if (validationError) {
      setError(validationError);
      return;
    }
    try {
      setIsSubmitting(true);
      setError("");
      const payload = {
        settings: { ...settings, examType },
        questionSetCombination: selections.map(
          (selection) => selection.questionSetId!,
        ),
        questionFilters: selections.map((selection) =>
          selection.topicSelections.length
            ? { topicSelections: selection.topicSelections }
            : undefined,
        ),
      };
      const response = await fetch("/api/quiz/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || data.error || "Failed to create exam");
      if (draftId) {
        try {
          removeExamDraft(draftId);
        } catch {
          /* The published exam was created successfully. */
        }
      }
      router.push("/");
      router.refresh();
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Failed to create exam",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#e5ebe8] bg-white px-4 py-4 shadow-sm">
          <div className="flex items-center">
            <button
              onClick={() => router.back()}
              className="mr-3 rounded-lg p-2 hover:bg-gray-100"
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-bold text-[#0d2818]">
              {draftId ? "Edit exam draft" : "Exam Builder"}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-gray-600">
              {stats.subjects}/{expectedCount} subjects · {stats.questions}{" "}
              questions selected
            </span>
            <button
              type="button"
              onClick={saveDraft}
              disabled={isSubmitting}
              className="rounded-lg border border-[#0d4a36] px-4 py-2 text-sm font-semibold text-[#0d4a36] hover:bg-[#eaf4ee] disabled:opacity-50"
            >
              Save draft
            </button>
          </div>
        </header>
        {draftNotice && (
          <p
            role="status"
            className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"
          >
            {draftNotice}
          </p>
        )}
        <div className="grid gap-6 lg:grid-cols-[13rem_1fr]">
          <aside className="space-y-2">
            <button
              onClick={() => setActiveTab("details")}
              className={`w-full rounded-lg px-4 py-3 text-left font-semibold ${activeTab === "details" ? "bg-blue-bg text-white" : "bg-white text-gray-700"}`}
            >
              Exam details
            </button>
            <button
              onClick={() => setActiveTab("question-sets")}
              className={`w-full rounded-lg px-4 py-3 text-left font-semibold ${activeTab === "question-sets" ? "bg-blue-bg text-white" : "bg-white text-gray-700"}`}
            >
              Subjects & topics
            </button>
          </aside>
          <section>
            {activeTab === "details" ? (
              <>
                <QuizSettingsComponent
                  settings={settings}
                  onSettingsChange={(next) => {
                    setSettings(next);
                    setDraftNotice("");
                  }}
                />
                <div className="mt-4 rounded-lg bg-white p-6 shadow">
                  <h2 className="text-lg font-semibold">Exam type</h2>
                  <p className="mb-4 mt-1 text-sm text-gray-600">
                    Changing the type clears the current subject and topic
                    selection.
                  </p>
                  <div className="flex gap-3">
                    {(["multi-subject", "single-subject"] as const).map(
                      (type) => (
                        <button
                          key={type}
                          onClick={() => changeExamType(type)}
                          className={`rounded-lg border-2 px-5 py-2 font-medium ${examType === type ? "border-blue-bg bg-blue-bg text-white" : "border-gray-300 text-gray-700"}`}
                        >
                          {type === "multi-subject"
                            ? "Multi-subject"
                            : "Single-subject"}
                        </button>
                      ),
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab("question-sets")}
                  className="mt-6 rounded-lg bg-blue-bg px-6 py-2 font-medium text-white"
                >
                  Next: select topics
                </button>
              </>
            ) : (
              <QuestionSetsSelector
                availableQuestionSets={availableQuestionSets}
                selections={selections}
                topicsByQuestionSet={topicsByQuestionSet}
                onQuestionSetChange={handleQuestionSetChange}
                onAddTopic={addTopic}
                onTopicChange={changeTopic}
                onQuestionCountChange={changeQuestionCount}
                onRemoveTopic={removeTopic}
                isLoading={isLoadingQuestionSets}
                onRefresh={fetchQuestionSets}
                examType={examType}
              />
            )}
            {error && (
              <p className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </p>
            )}
            {activeTab === "question-sets" && (
              <div className="mt-6 flex items-center justify-between rounded-lg bg-white p-4 shadow">
                <div className="text-sm text-gray-600">
                  Topic-based questions: {stats.questions}. Point total is
                  calculated from the sampled questions.
                </div>
                <button
                  onClick={submit}
                  disabled={isSubmitting || Boolean(validationError)}
                  className="rounded-lg bg-green-700 px-6 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? "Creating…" : "Create exam"}
                </button>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

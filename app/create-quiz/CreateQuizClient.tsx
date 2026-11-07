"use client";

import { ArrowLeft } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import QuizSettingsComponent from "../componets/QuizSettings";
import QuestionSetsSelector, {
  QuestionSet,
  SubjectSelection,
  Topic,
} from "../componets/QuestionSetsSelector";
import { QuizSettings } from "../types/global";
import { questionFilterFor } from "../lib/questionSelection";
import {
  readExamDrafts,
  removeExamDraft,
  saveExamDraft,
} from "../lib/examDrafts";

type ExamType = "multi-subject" | "single-subject";

interface CreateQuizClientProps {
  user?: unknown;
  quizId?: string;
}

type BankQuestion = { id: string; topicId: string | null; question: string; isArchived: boolean };
type SavedExam = {
  canEditQuestions: boolean;
  studentSelectsSubjects: boolean;
  examType: ExamType;
  settings: QuizSettings & { looseFocus: boolean };
  questionSets: { questionSetId: string; title: string; questions: { originalQuestionId: string }[];
    topicSelections: { topicId: string }[] }[];
};

const emptySelection = (): SubjectSelection => ({
  questionSetId: null,
  topicSelections: [],
});

export default function CreateQuizClient({ quizId }: CreateQuizClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"details" | "question-sets">(
    "details",
  );
  const [examType, setExamType] = useState<ExamType>("multi-subject");
  const [studentSelectsSubjects, setStudentSelectsSubjects] = useState(true);
  const [savedExam, setSavedExam] = useState<SavedExam | null>(null);
  const [editingQuestions, setEditingQuestions] = useState(false);
  const [loadingExam, setLoadingExam] = useState(Boolean(quizId));
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
  const [questionsByQuestionSet, setQuestionsByQuestionSet] = useState<
    Record<string, BankQuestion[]>
  >({});
  const [isLoadingQuestionSets, setIsLoadingQuestionSets] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [draftId, setDraftId] = useState<string | null>(null);
  const [draftNotice, setDraftNotice] = useState("");

  const expectedCount = quizId && !editingQuestions ? savedExam?.questionSets.length || 0 : studentSelectsSubjects ? availableQuestionSets.filter((set) => set.isActive).length : examType === "single-subject" ? 1 : 4;
  const fetchQuestionSets = useCallback(async (pool: boolean) => {
    try {
      setIsLoadingQuestionSets(true);
      const response = await fetch("/api/questionset", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Failed to load subjects");
      const subjects: QuestionSet[] = (data.questionSets || []).map(
          (set: QuestionSet & { _id?: string }) => ({
            ...set,
            id: set.id || set._id || "",
          }),
        );
      setAvailableQuestionSets(subjects);
      if (pool) setSelections((current) => subjects.filter((set) => set.isActive).map((set) => current.find((selection) => selection.questionSetId === set.id) || { questionSetId: set.id, topicSelections: [] }));
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Failed to load subjects",
      );
    } finally {
      setIsLoadingQuestionSets(false);
    }
  }, []);

  const fetchTopics = useCallback(async (questionSetId: string) => {
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
  }, []);

  const fetchQuestions = useCallback(async (questionSetId: string) => {
    const response = await fetch(`/api/questionset/${questionSetId}`, { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to load questions");
    const questions: BankQuestion[] = data.questionSet?.questions || [];
    setQuestionsByQuestionSet((current) => ({
      ...current,
      [questionSetId]: questions,
    }));
    return questions;
  }, []);

  const loadSubject = useCallback(async (questionSetId: string) => {
    const [topics, questions] = await Promise.all([fetchTopics(questionSetId), fetchQuestions(questionSetId)]);
    return { topics, questions };
  }, [fetchTopics, fetchQuestions]);

  useEffect(() => {
    if (quizId) {
      let cancelled = false;
      void (async () => {
        try {
          setLoadingExam(true);
          const response = await fetch(`/api/quiz/${quizId}`, { cache: 'no-store' });
          const data = await response.json();
          if (!response.ok) throw new Error(data.message || 'Unable to load exam');
          if (cancelled) return;
          const exam: SavedExam = data.quiz;
          setSavedExam(exam);
          setExamType(exam.examType);
          setStudentSelectsSubjects(exam.studentSelectsSubjects === true);
          setSettings((current) => ({ ...current, ...exam.settings, permitLoseFocus: exam.settings.looseFocus }));
          setSelections(exam.questionSets.map((set) => ({ questionSetId: set.questionSetId, topicSelections: [], questionIds: set.questions.map((question) => question.originalQuestionId) })));
          await fetchQuestionSets(false);
        } catch (reason) {
          if (!cancelled) setError(reason instanceof Error ? reason.message : 'Unable to load exam');
        } finally { if (!cancelled) setLoadingExam(false); }
      })();
      return () => { cancelled = true; };
    }
    const requestedDraftId = new URLSearchParams(window.location.search).get(
      "draft",
    );
    if (!requestedDraftId) { void fetchQuestionSets(true); return; }

    const draft = readExamDrafts().find((item) => item.id === requestedDraftId);
    if (!draft) {
      setError("This draft is no longer available in this browser.");
      return;
    }

    setDraftId(draft.id);
    setExamType(draft.examType);
    setStudentSelectsSubjects(draft.studentSelectsSubjects === true);
    void fetchQuestionSets(draft.studentSelectsSubjects === true);
    setSettings(draft.settings);
    const count = draft.studentSelectsSubjects ? draft.selections.length : draft.examType === "single-subject" ? 1 : 4;
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
      ].filter(() => !draft.studentSelectsSubjects).map(loadSubject),
    ).catch((reason) =>
      setError(
        reason instanceof Error
          ? reason.message
          : "Failed to load draft topics",
      ),
    );
  }, [loadSubject, fetchQuestionSets, quizId]);

  const beginEditingQuestions = async () => {
    if (!savedExam?.canEditQuestions) return;
    try {
      setIsLoadingQuestionSets(true);
      setError('');
      const ids = studentSelectsSubjects ? availableQuestionSets.filter((set) => set.isActive).map((set) => set.id) : savedExam.questionSets.map((set) => set.questionSetId);
      const restored = await Promise.all(ids.map(async (id) => {
        const { questions } = await loadSubject(id);
        const snapshot = savedExam.questionSets.find((set) => set.questionSetId === id);
        const originalIds = snapshot?.questions.map((question) => question.originalQuestionId) || [];
        return { questionSetId: id, questionIds: originalIds, topicSelections: (snapshot?.topicSelections || []).map((topic) => {
          const questionIds = originalIds.filter((questionId) => questions.some((question) => question.id === questionId && question.topicId === topic.topicId));
          return { topicId: topic.topicId, questionIds, questionCount: questionIds.length };
        }) };
      }));
      setSelections(restored);
      setEditingQuestions(true);
      setActiveTab('question-sets');
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to load topic questions'); }
    finally { setIsLoadingQuestionSets(false); }
  };

  const changeExamType = (type: ExamType) => {
    if (type === examType) return;
    setExamType(type);
    setStudentSelectsSubjects(type === 'multi-subject');
    setSelections(
      type === 'multi-subject'
        ? availableQuestionSets.filter((set) => set.isActive).map((set) => ({ questionSetId: set.id, topicSelections: [] }))
        : [emptySelection()],
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
        studentSelectsSubjects,
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
    if (!questionSetId || (topicsByQuestionSet[questionSetId] && questionsByQuestionSet[questionSetId])) return;
    try {
      await loadSubject(questionSetId);
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
          ? { ...topic, topicId, questionCount: 0, questionIds: [] }
          : topic,
      ),
    }));
  const removeTopic = (index: number, topicIndex: number) =>
    changeSelection(index, (selection) => ({
      ...selection,
      topicSelections: selection.topicSelections.filter(
        (_, itemIndex) => itemIndex !== topicIndex,
      ),
    }));
  const changeQuestions = (index: number, topicIndex: number | null, questionIds: string[]) =>
    changeSelection(index, (selection) => topicIndex === null ? { ...selection, questionIds } : ({
      ...selection,
      topicSelections: selection.topicSelections.map((topic, itemIndex) =>
        itemIndex === topicIndex ? { ...topic, questionIds, questionCount: questionIds.length } : topic),
    }));

  const validationError = useMemo(() => {
    if (!settings.title.trim()) return "Exam title is required.";
    if (settings.duration.hours * 3600 + settings.duration.minutes * 60 + settings.duration.seconds <= 0) return 'Set an exam duration greater than zero.';
    if (quizId && !editingQuestions) return '';
    if (studentSelectsSubjects && (expectedCount < 4 || availableQuestionSets.filter((set) => set.isActive && /^(?:use of english|english(?: language)?)$/i.test(set.title.trim().replace(/\s+/g, ' '))).length !== 1))
      return 'The mock needs English and at least three other active subjects.';
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
      const questions = questionsByQuestionSet[setId];
      const title = availableQuestionSets.find((set) => set.id === setId)?.title || 'this subject';
      if (!topics || !questions) return `Open ${title} and choose its topic questions.`;
      if (topics.filter((topic) => topic.isActive).length === 0) {
        if (studentSelectsSubjects) return `Add active topics and questions to ${title} before creating this mock.`;
        const eligible = new Set(questions.filter((question) => !question.isArchived).map((question) => question.id));
        const ids = selection.questionIds ?? [...eligible];
        if (!ids.length || new Set(ids).size !== ids.length || ids.some((id) => !eligible.has(id)))
          return "Select at least one available question for every subject.";
        continue;
      }
      if (!selection.topicSelections.length)
        return `Select at least one topic for ${title}.`;
      const used = new Set<string>();
      for (const choice of selection.topicSelections) {
        const topic = topics.find(
          (item) => item.id === choice.topicId && item.isActive,
        );
        if (!topic || used.has(choice.topicId))
          return "Choose a different active topic for each topic row.";
        const eligible = new Set((questionsByQuestionSet[setId] || []).filter((question) => question.topicId === topic.id && !question.isArchived).map((question) => question.id));
        const available = eligible.size;
        if (!choice.questionIds.length || choice.questionIds.length > available || choice.questionIds.some((id) => !eligible.has(id)))
          return `Review the selected questions for ${topic.name}.`;
        used.add(choice.topicId);
      }
    }
    return "";
  }, [expectedCount, selections, settings.title, settings.duration, topicsByQuestionSet, questionsByQuestionSet, studentSelectsSubjects, availableQuestionSets, quizId, editingQuestions]);

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
              (studentSelectsSubjects || hasTopics
                ? selection.topicSelections.reduce(
                    (sum, topic) => sum + topic.questionIds.length,
                    0,
                  )
                : selection.questionIds?.length ?? (selection.questionSetId ? questionsByQuestionSet[selection.questionSetId]?.filter((question) => !question.isArchived).length : undefined) ?? set?.questionCount ?? 0),
            points: total.points + (hasTopics ? 0 : set?.totalPoints || 0),
          };
        },
        { subjects: 0, questions: 0, points: 0 },
      ),
    [availableQuestionSets, selections, topicsByQuestionSet, questionsByQuestionSet, studentSelectsSubjects],
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
        settings: { ...settings, examType, studentSelectsSubjects },
        questionSetCombination: selections.map(
          (selection) => selection.questionSetId!,
        ),
        questionFilters: selections.map(questionFilterFor),
      };
      const response = await fetch(quizId ? `/api/quiz/${quizId}${editingQuestions ? '/question-sets' : ''}` : '/api/quiz/create', {
        method: quizId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(quizId ? { settings: payload.settings, ...(editingQuestions ? { questionSetIds: payload.questionSetCombination, questionFilters: payload.questionFilters } : {}) } : payload),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || data.error || (quizId ? 'Failed to save exam' : "Failed to create exam"));
      if (draftId) {
        try {
          removeExamDraft(draftId);
        } catch {
          /* The published exam was created successfully. */
        }
      }
      router.push(quizId ? `/exams/${quizId}` : "/");
      router.refresh();
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Failed to create exam",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingExam) return <main className="p-8" role="status">Loading exam…</main>;
  if (quizId && !savedExam) return <main className="p-8"><p role="alert">{error || 'Unable to load exam.'}</p><button className="mt-4 underline" onClick={() => window.location.reload()}>Retry</button></main>;
  const visibleStats = quizId && !editingQuestions && savedExam
    ? { subjects: savedExam.questionSets.length, questions: savedExam.questionSets.reduce((sum, set) => sum + set.questions.length, 0) }
    : stats;

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
              {quizId ? 'Edit exam' : draftId ? "Edit exam draft" : "Exam Builder"}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-gray-600">
              {visibleStats.subjects}/{expectedCount} subjects · {visibleStats.questions}{" "}
              questions selected
            </span>
            {!quizId && <button
              type="button"
              onClick={saveDraft}
              disabled={isSubmitting}
              className="rounded-lg border border-[#0d4a36] px-4 py-2 text-sm font-semibold text-[#0d4a36] hover:bg-[#eaf4ee] disabled:opacity-50"
            >
              Save draft
            </button>}
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
                    {quizId ? (studentSelectsSubjects ? 'Students choose compulsory English and three other subjects from this mock.' : 'The exam keeps its original subject selection mode.') : 'A mock includes all active subjects. Students choose compulsory English and three other subjects before starting. Changing the type clears the selection.'}
                  </p>
                  <div className="flex gap-3">
                    {(["multi-subject", "single-subject"] as const).map(
                      (type) => (
                        <button
                          key={type}
                          disabled={Boolean(quizId)}
                          onClick={() => changeExamType(type)}
                          className={`rounded-lg border-2 px-5 py-2 font-medium ${examType === type ? "border-blue-bg bg-blue-bg text-white" : "border-gray-300 text-gray-700"}`}
                        >
                          {type === "multi-subject"
                            ? "Mock exam"
                            : "Single-subject"}
                        </button>
                      ),
                    )}
                  </div>
                </div>
                {examType === 'multi-subject' && !studentSelectsSubjects && !quizId && <p className="mt-4 rounded-lg bg-amber-50 p-4 text-sm text-amber-900">This saved draft uses a fixed four-subject combination. <button type="button" className="font-semibold underline" onClick={() => { setStudentSelectsSubjects(true); setSelections(availableQuestionSets.filter((set) => set.isActive).map((set) => selections.find((selection) => selection.questionSetId === set.id) || { questionSetId: set.id, topicSelections: [] })); }}>Include all subjects instead</button></p>}
                <button
                  onClick={() => setActiveTab("question-sets")}
                  className="mt-6 rounded-lg bg-blue-bg px-6 py-2 font-medium text-white"
                >
                  {quizId ? 'View subjects & topics' : 'Next: select topics'}
                </button>
              </>
            ) : quizId && !editingQuestions ? (
              <div className="rounded-lg bg-white p-6 shadow">
                <h2 className="text-xl font-semibold">Subjects and topic questions</h2>
                <p className="mt-2 text-sm text-gray-600">{savedExam?.canEditQuestions ? 'You can edit the subject topics and question selections before students select subjects or begin an attempt.' : 'Students have selected subjects or started this exam. Its questions are protected to preserve attempts and results. You can still edit the settings.'}</p>
                <ul className="my-5 space-y-2 text-sm">{savedExam?.questionSets.map((set) => <li key={set.questionSetId}><strong>{set.title}</strong> · {set.questions.length} questions</li>)}</ul>
                {savedExam?.canEditQuestions && <button onClick={() => void beginEditingQuestions()} disabled={isLoadingQuestionSets || isSubmitting} className="rounded-lg border border-green-700 px-4 py-2 text-sm font-semibold text-green-800 disabled:opacity-50">{isLoadingQuestionSets ? 'Loading topics…' : 'Edit topic questions'}</button>}
              </div>
            ) : (
              <>
              {quizId && <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Review every subject before saving. Question bank changes may require you to select topic questions again. <button className="ml-2 font-semibold underline" onClick={() => setEditingQuestions(false)}>Cancel question edits</button></div>}
              <QuestionSetsSelector
                availableQuestionSets={availableQuestionSets}
                selections={selections}
                topicsByQuestionSet={topicsByQuestionSet}
                questionsByQuestionSet={questionsByQuestionSet}
                onQuestionSetChange={handleQuestionSetChange}
                onAddTopic={addTopic}
                onTopicChange={changeTopic}
                onQuestionsChange={changeQuestions}
                onRemoveTopic={removeTopic}
                isLoading={isLoadingQuestionSets}
                onRefresh={() => void fetchQuestionSets(studentSelectsSubjects)}
                examType={examType}
                studentSelectsSubjects={studentSelectsSubjects}
                onLoadSubject={(id) => { if (!topicsByQuestionSet[id] || !questionsByQuestionSet[id]) void loadSubject(id).catch((reason) => setError(reason instanceof Error ? reason.message : 'Unable to load subject')); }}
              />
              </>
            )}
            {error && (
              <p className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </p>
            )}
            {(quizId || activeTab === "question-sets") && (
              <div className="mt-6 flex items-center justify-between rounded-lg bg-white p-4 shadow">
                <div className="text-sm text-gray-600">
                  {quizId && !editingQuestions ? 'Saving settings keeps the current question paper.' : `Selected questions: ${visibleStats.questions}. Point total is calculated from the chosen questions.`}
                  {validationError && <p className="mt-1 text-amber-800" role="status">{validationError}</p>}
                </div>
                <button
                  onClick={submit}
                  disabled={isSubmitting || Boolean(validationError)}
                  className="rounded-lg bg-green-700 px-6 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? (quizId ? 'Saving…' : "Creating…") : quizId ? 'Save changes' : "Create exam"}
                </button>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

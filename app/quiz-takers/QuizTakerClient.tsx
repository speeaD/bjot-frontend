/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useMemo, useState, useEffect } from "react";
import {
  Search,
  UserPlus,
  Mail,
  Trash2,
  Send,
  X,
  XCircle,
  Filter,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Users,
  Award,
  Download,
  PlusCircle,
  Copy,
  BadgeCheck,
} from "lucide-react";
import DashboardHeader from "../componets/dashboard/DashboardHeader";
import DashboardTableLoading from "../componets/dashboard/DashboardTableLoading";

interface QuestionSet {
  _id: string;
  title: string;
}

interface QuizTaker {
  _id: string;
  email: string;
  name?: string;
  accountType: "premium" | "regular";
  accessCode?: string;
  isActive: boolean;
  questionSetCombination?: QuestionSet[];
  quizzesTaken?: number;
  assignedQuizzes?: any[];
  createdAt: string;
}

interface Quiz {
  _id: string;
  settings: {
    title: string;
    examType?: "multi-subject" | "single-subject";
  };
  questionSetCombination: string[];
}

// No Props interface needed — everything is fetched client-side

interface BulkUploadResult {
  row: number;
  email: string;
  accountType?: string;
  accessCode?: string;
  reason?: string;
}

export default function QuizTakersClient() {

  // UI States
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [, setShowResultsModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showUnassignModal, setShowUnassignModal] = useState(false);

  // Data States — start empty, populated on mount
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [selectedTakers, setSelectedTakers] = useState<string[]>([]);
  const [quizTakers, setQuizTakers] = useState<QuizTaker[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [questionSets, setQuestionSets] = useState<QuestionSet[]>([]);

  // Filter States
  const [accountTypeFilter, setAccountTypeFilter] = useState<
    "all" | "premium" | "regular"
  >("all");
  const [subjectFilter, setSubjectFilter] = useState<string[]>([]);
  const [assignedQuizFilter, setAssignedQuizFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [dateFilter, setDateFilter] = useState<
    "all" | "today" | "week" | "month"
  >("all");

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Form states
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [selectedQuestionSets, setSelectedQuestionSets] = useState<string[]>(
    [],
  );
  const [selectedQuizId, setSelectedQuizId] = useState("");
  const [selectedUnassignQuizId, setSelectedUnassignQuizId] = useState("");
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [, setUploadResults] = useState<{
    total: number;
    successCount: number;
    failCount: number;
    successful: BulkUploadResult[];
    failed: BulkUploadResult[];
  } | null>(null);

  // ─── Load all data on mount ───────────────────────────────────────────────
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsPageLoading(true);
        const [takersRes, quizzesRes, setsRes] = await Promise.all([
          fetch("/api/quiz-takers"),
          fetch("/api/quiz"),
          fetch("/api/questionset"),
        ]);

        const [takersData, quizzesData, setsData] = await Promise.all([
          takersRes.json(),
          quizzesRes.json(),
          setsRes.json(),
        ]);

        if (!takersRes.ok) throw new Error(takersData.message || 'Failed to load quiz takers');
        if (!quizzesRes.ok) throw new Error(quizzesData.message || 'Failed to load quizzes');
        if (!setsRes.ok) throw new Error(setsData.message || 'Failed to load question sets');

        setQuizTakers(takersData.quizTakers || []);
        setQuizzes(quizzesData.quizzes || []);
        setQuestionSets(setsData.questionSets || []);
      } catch (err) {
        console.error("Failed to load page data:", err);
        setError(err instanceof Error ? err.message : 'Failed to load quiz takers');
      } finally {
        setIsPageLoading(false);
      }
    };

    loadData();
  }, []);

  // ─── Memos ────────────────────────────────────────────────────────────────

  const uniqueCombinations = useMemo(() => {
    const combinations = new Map<string, { ids: string[]; titles: string[] }>();

    quizTakers.forEach((taker) => {
      if (
        taker.questionSetCombination &&
        taker.questionSetCombination.length > 0
      ) {
        const ids = taker.questionSetCombination.map((qs) => qs._id).sort();
        const titles = taker.questionSetCombination
          .map((qs) => qs.title)
          .sort();
        const key = ids.join(",");

        if (!combinations.has(key)) {
          combinations.set(key, { ids, titles });
        }
      }
    });

    return Array.from(combinations.entries()).map(([key, value]) => ({
      key,
      ids: value.ids,
      titles: value.titles,
      label: value.titles.join(" + "),
    }));
  }, [quizTakers]);

  const assignedQuizzesForFilter = useMemo(() => {
    const quizMap = new Map<string, string>();

    quizTakers.forEach((taker) => {
      if (taker.assignedQuizzes && taker.assignedQuizzes.length > 0) {
        taker.assignedQuizzes.forEach((quiz: any) => {
          if (!quizMap.has(quiz._id)) {
            const title =
              quiz.settings?.title || `Untitled Quiz (${quiz._id.slice(0, 8)})`;
            quizMap.set(quiz._id, title);
          }
        });
      }
    });

    return Array.from(quizMap.entries()).map(([id, title]) => ({ id, title }));
  }, [quizTakers]);

  const filteredQuizTakers = useMemo(() => {
    return quizTakers.filter((taker) => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        taker.email.toLowerCase().includes(searchLower) ||
        taker.name?.toLowerCase().includes(searchLower) ||
        taker.accessCode?.toLowerCase().includes(searchLower);

      if (!matchesSearch) return false;

      if (
        accountTypeFilter !== "all" &&
        taker.accountType !== accountTypeFilter
      )
        return false;

      if (statusFilter !== "all") {
        if (statusFilter === "active" && !taker.isActive) return false;
        if (statusFilter === "inactive" && taker.isActive) return false;
      }

      if (subjectFilter.length > 0) {
        const takerCombination =
          taker.questionSetCombination
            ?.map((qs) => qs._id)
            .sort()
            .join(",") || "";
        if (!subjectFilter.includes(takerCombination)) return false;
      }

      if (assignedQuizFilter !== "all") {
        if (assignedQuizFilter === "none") {
          if (taker.assignedQuizzes && taker.assignedQuizzes.length > 0)
            return false;
        } else {
          const hasQuiz = taker.assignedQuizzes?.some(
            (quiz: any) => quiz._id === assignedQuizFilter,
          );
          if (!hasQuiz) return false;
        }
      }

      if (dateFilter !== "all") {
        const createdDate = new Date(taker.createdAt);
        const diffDays =
          (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
        if (dateFilter === "today" && diffDays > 1) return false;
        if (dateFilter === "week" && diffDays > 7) return false;
        if (dateFilter === "month" && diffDays > 30) return false;
      }

      return true;
    });
  }, [
    quizTakers,
    searchTerm,
    accountTypeFilter,
    statusFilter,
    subjectFilter,
    assignedQuizFilter,
    dateFilter,
  ]);

  // Reset to page 1 whenever filters/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTerm,
    accountTypeFilter,
    statusFilter,
    subjectFilter,
    assignedQuizFilter,
    dateFilter,
    pageSize,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredQuizTakers.length / pageSize),
  );

  const paginatedQuizTakers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredQuizTakers.slice(start, start + pageSize);
  }, [filteredQuizTakers, currentPage, pageSize]);

  const compatibleQuizzes = useMemo(() => {
    if (selectedTakers.length === 0) return quizzes;

    const selectedTakerObjects = quizTakers.filter((t) =>
      selectedTakers.includes(t._id),
    );

    return quizzes.filter((quiz) => {
      const examType = quiz.settings.examType || "multi-subject";

      if (examType === "single-subject") {
        const requiredSubjectId = quiz.questionSetCombination[0];
        if (!requiredSubjectId) return false;

        return selectedTakerObjects.every((taker) => {
          const takerSubjectIds =
            taker.questionSetCombination?.map((qs) => qs._id) || [];
          return takerSubjectIds.includes(requiredSubjectId);
        });
      } else {
        const firstCombination = selectedTakerObjects[0]?.questionSetCombination
          ? [
              ...selectedTakerObjects[0].questionSetCombination.map(
                (qs) => qs._id,
              ),
            ].sort()
          : undefined;

        if (!firstCombination) return false;

        const allSameCombination = selectedTakerObjects.every((taker) => {
          const takerCombination = taker.questionSetCombination
            ? [...taker.questionSetCombination.map((qs) => qs._id)].sort()
            : undefined;
          return (
            JSON.stringify(takerCombination) ===
            JSON.stringify(firstCombination)
          );
        });

        if (!allSameCombination) return false;

        const quizCombination = [...(quiz.questionSetCombination || [])].sort();
        return (
          JSON.stringify(quizCombination) === JSON.stringify(firstCombination)
        );
      }
    });
  }, [selectedTakers, quizTakers, quizzes]);

  const assignedQuizzesForUnassign = useMemo(() => {
    if (selectedTakers.length === 0) return [];

    const quizCountMap = new Map<string, { title: string; count: number }>();
    const selectedTakerObjects = quizTakers.filter((t) =>
      selectedTakers.includes(t._id),
    );

    selectedTakerObjects.forEach((taker) => {
      taker.assignedQuizzes?.forEach((quiz: any) => {
        const title =
          quiz.quizId?.settings?.title ||
          `Untitled Quiz (${quiz._id.slice(0, 8)})`;
        const current = quizCountMap.get(quiz.quizId?._id);
        if (current) {
          quizCountMap.set(quiz.quizId?._id, {
            title,
            count: current.count + 1,
          });
        } else {
          quizCountMap.set(quiz.quizId?._id, { title, count: 1 });
        }
      });
    });

    return Array.from(quizCountMap.entries()).map(([id, data]) => ({
      id,
      title: data.title,
      count: data.count,
    }));
  }, [selectedTakers, quizTakers]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (accountTypeFilter !== "all") count++;
    if (statusFilter !== "all") count++;
    if (subjectFilter.length > 0) count++;
    if (assignedQuizFilter !== "all") count++;
    if (dateFilter !== "all") count++;
    return count;
  }, [
    accountTypeFilter,
    statusFilter,
    subjectFilter,
    assignedQuizFilter,
    dateFilter,
  ]);

  // ─── Helpers ──────────────────────────────────────────────────────────────

  const clearAllFilters = () => {
    setAccountTypeFilter("all");
    setStatusFilter("all");
    setSubjectFilter([]);
    setAssignedQuizFilter("all");
    setDateFilter("all");
  };

  const handleExportCsv = () => {
    const escapeCsv = (value: string | number | boolean | undefined) =>
      `"${String(value ?? "").replaceAll('"', '""')}"`;
    const rows = filteredQuizTakers.map((taker) =>
      [
        taker.name || "",
        taker.email,
        taker.accountType,
        taker.isActive ? "Active" : "Inactive",
        taker.accessCode || "",
        taker.questionSetCombination
          ?.map((subject) => subject.title)
          .join(", ") || "",
        taker.assignedQuizzes?.length || 0,
      ]
        .map(escapeCsv)
        .join(","),
    );
    const csv = [
      [
        "Name",
        "Email",
        "Account Type",
        "Status",
        "Access Code",
        "Subject Combination",
        "Assigned Exams",
      ].join(","),
      ...rows,
    ].join("\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8;" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "bjot-candidate-directory.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const refreshQuizTakers = async () => {
    const res = await fetch("/api/quiz-takers");
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to refresh quiz takers');
    setQuizTakers(data.quizTakers || []);
  };

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleQuestionSetToggle = (id: string) => {
    setSelectedQuestionSets((prev) => {
      if (prev.includes(id)) return prev.filter((item) => item !== id);
      if (prev.length < 4) return [...prev, id];
      return prev;
    });
  };

  const handleSelectAll = () => {
    const pageIds = paginatedQuizTakers.map((t) => t._id);
    const allSelected = pageIds.every((id) => selectedTakers.includes(id));
    if (allSelected) {
      setSelectedTakers((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      setSelectedTakers((prev) => [...new Set([...prev, ...pageIds])]);
    }
  };

  const handleSelectTaker = (id: string) => {
    setSelectedTakers((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    );
  };

  const toggleSubjectFilter = (key: string) => {
    setSubjectFilter((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const handleAddQuizTaker = async () => {
    if (!newEmail.trim()) {
      alert("Please enter an email address");
      return;
    }

    if (selectedQuestionSets.length !== 4) {
      alert("Please select exactly 4 question sets");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const response = await fetch("/api/quiz-takers/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newEmail,
          name: newName || undefined,
          questionSetCombination: selectedQuestionSets,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create student");
      }

      const data = await response.json();
      await refreshQuizTakers();
      setNewEmail("");
      setNewName("");
      setSelectedQuestionSets([]);
      setShowAddModal(false);
      alert(
        `Premium quiz taker created successfully! Access Code: ${data.quizTaker.accessCode}`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create student");
      alert(err instanceof Error ? err.message : "Failed to create student");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteQuizTaker = async (id: string, email: string) => {
    if (!confirm(`Are you sure you want to delete ${email}?`)) return;

    try {
      const response = await fetch("/api/quiz-takers/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) throw new Error("Failed to delete student");

      setQuizTakers((prev) => prev.filter((t) => t._id !== id));
      setSelectedTakers((prev) => prev.filter((t) => t !== id));
      alert("Student deleted successfully");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete student");
    }
  };

  const handleDeleteSelected = async () => {
    if (!confirm(`Delete ${selectedTakers.length} quiz taker(s)?`)) return;

    try {
      const response = await fetch("/api/quiz-takers/delete-multiple", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedTakers }),
      });

      if (!response.ok) throw new Error("Failed to delete students");

      setQuizTakers((prev) =>
        prev.filter((t) => !selectedTakers.includes(t._id)),
      );
      setSelectedTakers([]);
      alert("Students deleted successfully");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete students");
    }
  };

  const handleBulkUpload = async () => {
    if (!importFile) return;

    const formData = new FormData();
    formData.append("file", importFile);

    try {
      setIsSubmitting(true);
      const response = await fetch("/api/quiz-takers/bulk-upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Failed to upload file");

      const data = await response.json();
      setUploadResults(data.results);
      setShowResultsModal(true);
      setShowImportModal(false);
      setImportFile(null);
      await refreshQuizTakers();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to upload file");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignQuiz = async () => {
    if (!selectedQuizId || selectedTakers.length === 0) return;

    try {
      setIsSubmitting(true);
      const response = await fetch("/api/quiz-takers/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quizTakerIds: selectedTakers,
          quizId: selectedQuizId,
        }),
      });

      if (!response.ok) throw new Error("Failed to assign exam");

      alert("Exam assigned successfully");
      setShowAssignModal(false);
      setSelectedQuizId("");
      await refreshQuizTakers();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to assign exam");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnassignQuiz = async () => {
    if (!selectedUnassignQuizId || selectedTakers.length === 0) return;

    try {
      setIsSubmitting(true);
      const response = await fetch("/api/quiz-takers/unassign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quizTakerIds: selectedTakers,
          quizId: selectedUnassignQuizId,
        }),
      });

      if (!response.ok) throw new Error("Failed to unassign exam");

      alert("Exam unassigned successfully");
      setShowUnassignModal(false);
      setSelectedUnassignQuizId("");
      await refreshQuizTakers();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to unassign exam");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendInvites = async () => {
    if (selectedTakers.length === 0) return;

    try {
      setIsSubmitting(true);
      const response = await fetch("/api/quiz-takers/send-invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizTakerIds: selectedTakers }),
      });

      if (!response.ok) throw new Error("Failed to send invites");

      alert(`Invites sent to ${selectedTakers.length} quiz taker(s)`);
      setSelectedTakers([]);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to send invites");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      const response = await fetch(`/api/quiz-takers/${id}/update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentActive }),
      });

      if (!response.ok) throw new Error("Failed to update status");

      setQuizTakers((prev) =>
        prev.map((t) =>
          t._id === id ? { ...t, isActive: !currentActive } : t,
        ),
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update status");
    }
  };

  const totalStudents = quizTakers.length;
  const premiumStudents = quizTakers.filter(
    (t) => t.accountType === "premium",
  ).length;
  const activeStudents = quizTakers.filter((t) => t.isActive).length;
  const joinedThisWeek = quizTakers.filter(
    (t) =>
      Date.now() - new Date(t.createdAt).getTime() < 7 * 24 * 60 * 60 * 1000,
  ).length;
  const displayCount = (count: number) => isPageLoading ? "—" : count.toLocaleString();

  // ─── Main render ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#f4f7f8] text-[#202b2a]">
      <main>
        {error && !showAddModal && (
          <div className="mx-auto mt-4 max-w-[1760px] px-4 sm:px-5 xl:px-5">
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          </div>
        )}
        <DashboardHeader
          adminName="Blast Jamb Online"
          adminRole="Administrator"
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Search student name, email, access code, or exam cohort..."
        />

        <div className="mx-auto max-w-[1760px] px-4 py-4 sm:px-5 xl:px-5">
          <div>
            <section className="relative mb-5 overflow-hidden rounded-2xl bg-[#003c2f] px-5 py-5 text-white shadow-sm sm:px-6">
              
              <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
                <div>

                  <h1 className="text-3xl font-bold tracking-tight sm:text-[34px]">
                    Manage Students
                  </h1>
                  <p className="mt-1 max-w-[670px] text-sm leading-5 text-[#a4c8bd]">
                    Manage student enrollments, monitor access code status,
                    assign CBT mock exams, and review subject combinations.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleExportCsv}
                    disabled={isPageLoading}
                    className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/15 disabled:opacity-50"
                  >
                    <Download className="h-4 w-4 text-[#f7aa34]" />
                    Bulk Upload CSV
                  </button>
                  
                  <button
                    onClick={() => setShowAddModal(true)}
                    disabled={isPageLoading}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#ff951f] px-4 py-2 text-xs font-bold text-white shadow-[0_4px_14px_rgba(255,149,31,.28)] hover:bg-[#ed8510] disabled:opacity-50"
                  >
                    <PlusCircle className="h-4 w-4" />
                    Add Premium Student
                  </button>
                </div>
              </div>
            </section>

            <section className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-xl border border-[#e8eeee] bg-white p-4 shadow-sm">
                <div className="flex justify-between text-[10px] font-bold tracking-[.12em] text-[#5c6664]">
                  <span>TOTAL ENROLLED</span>
                  <span className="rounded bg-[#f4f8f6] p-1 text-[#124c3b]">
                    <Users className="h-4 w-4" />
                  </span>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <strong className="text-2xl text-[#0d3c31]">
                    {displayCount(totalStudents)}
                  </strong>
                  <span className="text-xs text-slate-500">registered students</span>
                </div>
                {/* <p className="mt-1 text-xs font-semibold text-[#22624e]">
                  ↑ +48 this mo (+24% cohort growth)
                </p> */}
              </div>
              <div className="rounded-xl border border-[#e8eeee] bg-white p-4 shadow-sm">
                <div className="flex justify-between text-[10px] font-bold tracking-[.12em] text-[#5c6664]">
                  <span>PREMIUM PLAN</span>
                  <span className="rounded bg-[#fff7ec] p-1 text-[#b46710]">
                    <Award className="h-4 w-4" />
                  </span>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <strong className="text-2xl text-[#27302f]">
                    {displayCount(premiumStudents)}
                  </strong>
                  <span className="text-xs text-slate-500">active subs</span>
                </div>
                {/* <p className="mt-1 text-xs text-slate-500">
                  <span className="text-[#ff951f]">●</span> Full Access • CBT
                  Mock + Remedial Banks
                </p> */}
              </div>
              <div className="rounded-xl border border-[#e8eeee] bg-white p-4 shadow-sm">
                <div className="flex justify-between text-[10px] font-bold tracking-[.12em] text-[#5c6664]">
                  <span>ACTIVE STATUS</span>
                  <span className="rounded bg-[#fff7ec] p-1 text-[#ff951f]">
                    <BadgeCheck className="h-4 w-4" />
                  </span>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <strong className="text-2xl text-[#0d3c31]">
                    {displayCount(activeStudents)}
                  </strong>
                  <span className="text-xs text-slate-500">
                    enabled (
                    {isPageLoading ? "—" : totalStudents
                      ? Math.round((activeStudents / totalStudents) * 100)
                      : 0}
                    %)
                  </span>
                </div>
                <div className="mt-1 flex justify-between text-xs">
                  <span className="font-semibold text-[#b46710]">
                    ● Live Now
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {displayCount(totalStudents - activeStudents)} DEACTIVATED
                  </span>
                </div>
              </div>
              <div className="rounded-xl border border-[#e8eeee] bg-white p-4 shadow-sm">
                <div className="flex justify-between text-[10px] font-bold tracking-[.12em] text-[#5c6664]">
                  <span>JOINED THIS WEEK</span>
                  <span className="rounded bg-[#f4f8f6] p-1 text-[#124c3b]">
                    <UserPlus className="h-4 w-4" />
                  </span>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <strong className="text-2xl text-[#0d3c31]">
                    {displayCount(joinedThisWeek)}
                  </strong>
                  <span className="text-xs text-slate-500">registrants</span>
                </div>
                <p className="mt-1 text-xs font-semibold text-[#355d51]">
                  ▣ Awaiting verification
                </p>
              </div>
            </section>

            {/* Directory filters */}
            <div className="mb-4 overflow-hidden rounded-xl border border-[#e6eceb] bg-white shadow-sm">
              <div className="flex flex-col gap-3 border-b border-[#edf1f0] px-3 py-2.5 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-1 overflow-x-auto text-xs font-semibold whitespace-nowrap">
                  <button
                    onClick={clearAllFilters}
                    className={`rounded-md px-3 py-2 ${activeFilterCount === 0 ? "bg-[#0a4c3b] text-white" : "text-slate-600 hover:bg-slate-100"}`}
                  >
                    All Students ({displayCount(totalStudents)})
                  </button>
                  <button
                    onClick={() => setStatusFilter("active")}
                    className={`rounded-md px-3 py-2 ${statusFilter === "active" ? "bg-[#e8f4ef] text-[#0c4e3d]" : "text-slate-600 hover:bg-slate-100"}`}
                  >
                    <span className="mr-1 text-[#ffbb70]">●</span>Active (
                    {displayCount(activeStudents)})
                  </button>
                  <button
                    onClick={() => setStatusFilter("inactive")}
                    className={`rounded-md px-3 py-2 ${statusFilter === "inactive" ? "bg-[#f9ecec] text-[#a73737]" : "text-slate-600 hover:bg-slate-100"}`}
                  >
                    Inactive ({displayCount(totalStudents - activeStudents)})
                  </button>
                  <button
                    onClick={() => setAccountTypeFilter("premium")}
                    className={`rounded-md px-3 py-2 ${accountTypeFilter === "premium" ? "bg-[#fff4e5] text-[#a55a08]" : "text-slate-600 hover:bg-slate-100"}`}
                  >
                    Premium ({displayCount(premiumStudents)})
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative min-w-[210px] flex-1 lg:w-[240px] lg:flex-none">
                    <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Filter by email, name, or code..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full rounded-md border border-slate-300 bg-[#f9fafb] py-1.5 pl-8 pr-2 text-xs outline-none focus:border-[#0c5c47]"
                    />
                  </div>
                  <button
                    onClick={() => setShowFilterPanel(!showFilterPanel)}
                    className="rounded-md bg-[#f2f5f4] p-2 text-[#365b50] hover:bg-[#e5eeeb]"
                    aria-label="Toggle filters"
                  >
                    <Filter className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Filter Toggle Button - Mobile */}
              <button
                onClick={() => setShowFilterPanel(!showFilterPanel)}
                className="mx-3 mt-3 flex w-[calc(100%-1.5rem)] items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 md:hidden"
              >
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">
                    Filters
                  </span>
                  {activeFilterCount > 0 && (
                    <span className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                      {activeFilterCount}
                    </span>
                  )}
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-gray-600 transition-transform ${
                    showFilterPanel ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Filters Panel - Responsive */}
              <div
                className={`${showFilterPanel ? "block" : "hidden"} space-y-4 border-b border-[#edf1f0] bg-[#fbfcfc] px-3 py-3`}
              >
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {/* Account Type Filter */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Account Type
                    </label>
                    <select
                      value={accountTypeFilter}
                      onChange={(e) =>
                        setAccountTypeFilter(e.target.value as any)
                      }
                      className="w-full rounded-md border border-gray-300 bg-[#f0f2f3] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8fc9b8]"
                    >
                      <option value="all">All Types</option>
                      <option value="premium">Premium</option>
                      <option value="regular">Regular</option>
                    </select>
                  </div>

                  {/* Status Filter */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Status
                    </label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as any)}
                      className="w-full rounded-md border border-gray-300 bg-[#f0f2f3] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8fc9b8]"
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>

                  {/* Date Filter */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Created
                    </label>
                    <select
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value as any)}
                      className="w-full rounded-md border border-gray-300 bg-[#f0f2f3] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8fc9b8]"
                    >
                      <option value="all">All Time</option>
                      <option value="today">Today</option>
                      <option value="week">This Week</option>
                      <option value="month">This Month</option>
                    </select>
                  </div>

                  {/* Assigned Quiz Filter */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Assigned Exam
                    </label>
                    <select
                      value={assignedQuizFilter}
                      onChange={(e) => setAssignedQuizFilter(e.target.value)}
                      className="w-full rounded-md border border-gray-300 bg-[#f0f2f3] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8fc9b8]"
                    >
                      <option value="all">All Exams</option>
                      <option value="none">No Exam Assigned</option>
                      {assignedQuizzesForFilter.map((quiz) => (
                        <option key={quiz.id} value={quiz.id}>
                          {quiz.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Subject Filter - Checkboxes */}
                {uniqueCombinations.length > 0 && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">
                      Subject Combinations
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-32 overflow-y-auto p-2 bg-gray-50 rounded-lg border border-gray-200">
                      {uniqueCombinations.map((combo) => (
                        <label
                          key={combo.key}
                          className="flex items-start gap-2 p-2 rounded hover:bg-white cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={subjectFilter.includes(combo.key)}
                            onChange={() => toggleSubjectFilter(combo.key)}
                            className="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-xs text-gray-700 line-clamp-2">
                            {combo.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Clear Filters Button */}
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearAllFilters}
                    className="w-full md:w-auto px-4 py-2 text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    Clear all filters
                  </button>
                )}
              </div>

              {/* Results Count */}
              <div className="flex flex-col gap-3 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                {isPageLoading ? <p className="text-xs text-gray-600">Loading students…</p> : <p className="text-xs text-gray-600">
                  Showing{" "}
                  <span className="font-semibold">
                    {Math.min(
                      (currentPage - 1) * pageSize + 1,
                      filteredQuizTakers.length,
                    ) || 0}
                    –
                    {Math.min(
                      currentPage * pageSize,
                      filteredQuizTakers.length,
                    )}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold">
                    {filteredQuizTakers.length}
                  </span>{" "}
                  students
                </p>}

                {/* Bulk Actions - Only show when items selected */}
                {selectedTakers.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={handleSendInvites}
                      disabled={isSubmitting}
                      className="flex items-center gap-1.5 rounded-md bg-[#0a4c3b] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#063f31] disabled:opacity-50"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      Send Invites ({selectedTakers.length})
                    </button>
                    <button
                      onClick={() => setShowAssignModal(true)}
                      disabled={isSubmitting}
                      className="flex items-center gap-1.5 rounded-md bg-[#286e9e] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#225d85] disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Assign Quiz
                    </button>
                    <button
                      onClick={() => setShowUnassignModal(true)}
                      disabled={isSubmitting}
                      className="flex items-center gap-1.5 rounded-md bg-[#c57716] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#a9600d] disabled:opacity-50"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Unassign
                    </button>
                    <button
                      onClick={handleDeleteSelected}
                      disabled={isSubmitting}
                      className="flex items-center gap-1.5 rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Candidate directory */}
            <div aria-busy={isPageLoading} className="overflow-hidden rounded-xl border border-[#e6eceb] bg-white shadow-sm">
              {isPageLoading ? <DashboardTableLoading label="Loading students" /> : <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full min-w-[1060px]">
                  <thead className="border-b border-[#e4e9e8] bg-[#f1f3f4]">
                    <tr>
                      <th className="px-3 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={
                            paginatedQuizTakers.length > 0 &&
                            paginatedQuizTakers.every((t) =>
                              selectedTakers.includes(t._id),
                            )
                          }
                          onChange={handleSelectAll}
                          className="rounded border-gray-300"
                        />
                      </th>
                      <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#5d6665]">
                        Student / Candidate
                      </th>
                      <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#5d6665]">
                        Type
                      </th>
                      <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#5d6665]">
                        Status
                      </th>
                      <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#5d6665]">
                        Access Code
                      </th>
                      <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#5d6665]">
                        Subject Combination
                      </th>
                      <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#5d6665]">
                        Mock Exams
                      </th>
                      <th className="px-3 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-[#5d6665]">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#edf1f0]">
                    {filteredQuizTakers.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center justify-center">
                            <Users className="w-12 h-12 text-gray-300 mb-3" />
                            <p className="text-gray-500 font-medium">
                              No students found
                            </p>
                            <p className="text-sm text-gray-400 mt-1">
                              {searchTerm || activeFilterCount > 0
                                ? "Try adjusting your filters"
                                : "Add your first student to get started"}
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      paginatedQuizTakers.map((taker) => (
                        <tr
                          key={taker._id}
                          className={`transition-colors hover:bg-[#f8fbfa] ${selectedTakers.includes(taker._id) ? "bg-[#f1f6f4]" : ""}`}
                        >
                          <td className="px-3 py-3">
                            <input
                              type="checkbox"
                              checked={selectedTakers.includes(taker._id)}
                              onChange={() => handleSelectTaker(taker._id)}
                              className="rounded border-gray-300"
                            />
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-[9px] font-bold ${taker.isActive ? "bg-[#e1eee9] text-[#164b3c]" : "bg-[#edf0f0] text-[#64716e]"}`}
                              >
                                {(taker.name || taker.email)
                                  .slice(0, 2)
                                  .toUpperCase()}
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-[#27302f]">
                                  {taker.name || "No Name"}
                                </p>
                                <p className="text-[10px] text-gray-500">
                                  {taker.email}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <span
                              className={`rounded-full px-2 py-1 text-[10px] font-bold ${
                                taker.accountType === "premium"
                                  ? "bg-[#fff0df] text-[#ad6511]"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {taker.accountType}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={taker.isActive}
                                onChange={() =>
                                  handleToggleActive(taker._id, taker.isActive)
                                }
                                className="sr-only peer"
                              />
                              <div className="peer h-5 w-9 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white peer-checked:bg-[#074b3a] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-200"></div>
                              <span
                                className={`ml-2 text-xs font-semibold ${taker.isActive ? "text-[#155544]" : "text-red-600"}`}
                              >
                                {taker.isActive ? "Active" : "Inactive"}
                              </span>
                            </label>
                          </td>
                          <td className="px-3 py-3">
                            <button
                              onClick={() =>
                                navigator.clipboard?.writeText(
                                  taker.accessCode || "",
                                )
                              }
                              title="Copy access code"
                              className="inline-flex items-center gap-1 rounded-sm bg-[#edf0f0] px-2 py-1 font-mono text-[10px] font-bold text-[#35413f] hover:bg-[#dfe7e4]"
                            >
                              {taker.accessCode || "N/A"}
                              <Copy className="h-3 w-3 text-slate-500" />
                            </button>
                          </td>
                          <td className="px-3 py-3">
                            <div className="text-[11px] text-[#36403e]">
                              {taker.questionSetCombination &&
                              taker.questionSetCombination.length > 0 ? (
                                <div className="space-y-1">
                                  <div className="max-w-[180px] truncate font-medium">
                                    {taker.questionSetCombination
                                      .slice(0, 2)
                                      .map((qs) => qs.title)
                                      .join(", ")}
                                  </div>
                                  {taker.questionSetCombination.length > 2 && (
                                    <span className="rounded-sm bg-[#e9efed] px-1.5 py-0.5 text-[9px] font-bold text-[#36554d]">
                                      +{taker.questionSetCombination.length - 2}{" "}
                                      more
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-gray-400">None</span>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <span className="rounded-sm bg-[#e9efed] px-1.5 py-0.5 text-[10px] font-bold text-[#31584d]">
                              {taker.assignedQuizzes?.length || 0} assigned
                            </span>
                          </td>
                          <td className="px-3 py-3 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => {
                                  setSelectedTakers([taker._id]);
                                  handleSendInvites();
                                }}
                                className="rounded p-1.5 text-[#2b5e83] hover:bg-blue-50"
                                title="Send Invite"
                              >
                                <Mail className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedTakers([taker._id]);
                                  setShowUnassignModal(true);
                                }}
                                className="rounded p-1.5 text-[#b96d13] hover:bg-orange-50"
                                title="Unassign"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() =>
                                  handleDeleteQuizTaker(taker._id, taker.email)
                                }
                                className="rounded p-1.5 text-[#63716e] hover:bg-red-50 hover:text-red-600"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden divide-y divide-gray-200">
                {filteredQuizTakers.length === 0 ? (
                  <div className="px-4 py-12 text-center">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">
                      No students found
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      {searchTerm || activeFilterCount > 0
                        ? "Try adjusting your filters"
                        : "Add your first student to get started"}
                    </p>
                  </div>
                ) : (
                  paginatedQuizTakers.map((taker) => (
                    <div key={taker._id} className="p-4">
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={selectedTakers.includes(taker._id)}
                          onChange={() => handleSelectTaker(taker._id)}
                          className="mt-1 rounded border-gray-300"
                        />

                        <div className="flex-1 min-w-0">
                          {/* Name and Email */}
                          <div className="mb-2">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {taker.name || "No Name"}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {taker.email}
                            </p>
                          </div>

                          {/* Badges */}
                          <div className="flex flex-wrap gap-2 mb-3">
                            <span
                              className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                                taker.accountType === "premium"
                                  ? "bg-purple-100 text-purple-700"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {taker.accountType}
                            </span>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={taker.isActive}
                                onChange={() =>
                                  handleToggleActive(taker._id, taker.isActive)
                                }
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                              <span
                                className={`ml-3 text-xs font-medium ${taker.isActive ? "text-green-700" : "text-red-700"}`}
                              >
                                {taker.isActive ? "Active" : "Inactive"}
                              </span>
                            </label>
                            {taker.accessCode && (
                              <code className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                                {taker.accessCode}
                              </code>
                            )}
                          </div>

                          {/* Additional Info */}
                          <div className="space-y-1 text-xs text-gray-600">
                            <div className="flex items-center justify-between">
                              <span className="text-gray-500">Subjects:</span>
                              <span className="font-medium">
                                {taker.questionSetCombination?.length || 0}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-500">
                                Assigned Exams:
                              </span>
                              <span className="font-medium">
                                {taker.assignedQuizzes?.length || 0}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 flex-shrink-0">
                          <button
                            onClick={() => {
                              setSelectedTakers([taker._id]);
                              handleSendInvites();
                            }}
                            className="text-blue-600 hover:text-blue-700 p-2 rounded-lg hover:bg-blue-50 transition-colors flex-shrink-0"
                            title="Send Invite"
                          >
                            <Mail className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedTakers([taker._id]);
                              setShowUnassignModal(true);
                            }}
                            className="text-orange-600 hover:text-orange-700 p-2 rounded-lg hover:bg-orange-50 transition-colors flex-shrink-0"
                            title="Unassign"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() =>
                              handleDeleteQuizTaker(taker._id, taker.email)
                            }
                            className="text-red-600 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors flex-shrink-0"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Pagination Bar */}
              {filteredQuizTakers.length > 0 && (
                <div className="flex flex-col items-center justify-between gap-3 border-t border-[#e7eceb] bg-[#f4f6f7] px-4 py-3 sm:flex-row">
                  {/* Page size selector + info */}
                  <div className="flex items-center gap-3 text-xs text-gray-600">
                    <span>Rows per page:</span>
                    <select
                      value={pageSize}
                      onChange={(e) => setPageSize(Number(e.target.value))}
                      className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-[#8fc9b8]"
                    >
                      {[10, 20, 50, 100].map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                    <span className="hidden sm:inline">
                      {Math.min(
                        (currentPage - 1) * pageSize + 1,
                        filteredQuizTakers.length,
                      )}
                      –
                      {Math.min(
                        currentPage * pageSize,
                        filteredQuizTakers.length,
                      )}{" "}
                      of {filteredQuizTakers.length}
                    </span>
                  </div>

                  {/* Page controls */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className="rounded-md p-1.5 text-gray-500 hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-40"
                      title="First page"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="flex items-center gap-1 rounded-md px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Prev
                    </button>

                    {/* Page number buttons */}
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(
                          (p) =>
                            p === 1 ||
                            p === totalPages ||
                            Math.abs(p - currentPage) <= 1,
                        )
                        .reduce<(number | "ellipsis")[]>((acc, p, idx, arr) => {
                          if (idx > 0 && p - (arr[idx - 1] as number) > 1)
                            acc.push("ellipsis");
                          acc.push(p);
                          return acc;
                        }, [])
                        .map((item, idx) =>
                          item === "ellipsis" ? (
                            <span
                              key={`ellipsis-${idx}`}
                              className="px-1 text-gray-400 text-sm"
                            >
                              …
                            </span>
                          ) : (
                            <button
                              key={item}
                              onClick={() => setCurrentPage(item as number)}
                              className={`min-w-[28px] rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                                currentPage === item
                                  ? "bg-[#0a4c3b] text-white"
                                  : "text-gray-600 hover:bg-gray-200"
                              }`}
                            >
                              {item}
                            </button>
                          ),
                        )}
                    </div>

                    <button
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="flex items-center gap-1 rounded-md px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Next
                    </button>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className="rounded-md p-1.5 text-gray-500 hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-40"
                      title="Last page"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
              </>}
            </div>

            
            {/* <p className="py-6 text-center text-xs text-slate-500">
              © 2026 BJOT Collegiate Examination Board • Automated Biometric
              Verification & JAMB Standardized UTME Network
            </p> */}
          </div>
        </div>
      </main>

      {/* Add Quiz Taker Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">Add Premium Student</h3>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setNewEmail("");
                    setNewName("");
                    setSelectedQuestionSets([]);
                    setError(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="student@example.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name (Optional)
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject Combination * (Select exactly 4)
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  Selected: {selectedQuestionSets.length}/4
                </p>
                <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-3">
                  {questionSets.map((qs) => (
                    <label
                      key={qs._id}
                      className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedQuestionSets.includes(qs._id)
                          ? "bg-indigo-50 border-2 border-indigo-500"
                          : "bg-gray-50 border-2 border-transparent hover:bg-gray-100"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedQuestionSets.includes(qs._id)}
                        onChange={() => handleQuestionSetToggle(qs._id)}
                        disabled={
                          isSubmitting ||
                          (!selectedQuestionSets.includes(qs._id) &&
                            selectedQuestionSets.length >= 4)
                        }
                        className="rounded border-gray-300 mr-3"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{qs.title}</p>
                      </div>
                      {selectedQuestionSets.includes(qs._id) && (
                        <span className="px-2 py-1 bg-indigo-600 text-white text-xs rounded">
                          #{selectedQuestionSets.indexOf(qs._id) + 1}
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewEmail("");
                  setNewName("");
                  setSelectedQuestionSets([]);
                  setError(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleAddQuizTaker}
                className="px-4 py-2 bg-green-bg text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                disabled={isSubmitting || selectedQuestionSets.length !== 4}
              >
                {isSubmitting ? "Adding..." : "Add Premium Student"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">Import Students</h3>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportFile(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Upload a CSV or Excel file with email addresses. The file should
              have an &quot;email&quot; column.
            </p>

            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(e) => setImportFile(e.target.files?.[0] || null)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4"
              disabled={isSubmitting}
            />

            {importFile && (
              <p className="text-sm text-gray-600 mb-4">
                Selected: {importFile.name}
              </p>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportFile(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleBulkUpload}
                className="px-4 py-2 bg-blue-bg text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                disabled={isSubmitting || !importFile}
              >
                {isSubmitting ? "Importing..." : "Import"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Quiz Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">Assign Exam</h3>
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedQuizId("");
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Select an exam to assign to {selectedTakers.length} student(s)
            </p>

            {compatibleQuizzes.length === 0 && selectedTakers.length > 0 ? (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
                No compatible exams found. Selected students have different
                subject combinations.
              </div>
            ) : (
              <select
                value={selectedQuizId}
                onChange={(e) => setSelectedQuizId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSubmitting}
              >
                <option value="">Select an exam...</option>
                {compatibleQuizzes.map((quiz) => (
                  <option key={quiz._id} value={quiz._id}>
                    {quiz.settings.title ||
                      `Untitled Exam (${quiz._id.slice(0, 8)})`}
                  </option>
                ))}
              </select>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedQuizId("");
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleAssignQuiz}
                className="px-4 py-2 bg-blue-bg text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                disabled={isSubmitting || !selectedQuizId}
              >
                {isSubmitting ? "Assigning..." : "Assign"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unassign Quiz Modal */}
      {showUnassignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">Unassign Exam</h3>
              <button
                onClick={() => {
                  setShowUnassignModal(false);
                  setSelectedUnassignQuizId("");
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Select an exam to unassign from {selectedTakers.length} student(s)
            </p>

            {assignedQuizzesForUnassign.length === 0 ? (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
                No assigned exams found for the selected students.
              </div>
            ) : (
              <select
                value={selectedUnassignQuizId}
                onChange={(e) => setSelectedUnassignQuizId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-orange-500"
                disabled={isSubmitting}
              >
                <option value="">Select an exam to unassign...</option>
                {assignedQuizzesForUnassign.map((quiz) => (
                  <option key={quiz.id} value={quiz.id}>
                    {quiz.title} ({quiz.count} of {selectedTakers.length}{" "}
                    selected)
                  </option>
                ))}
              </select>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowUnassignModal(false);
                  setSelectedUnassignQuizId("");
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleUnassignQuiz}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
                disabled={isSubmitting || !selectedUnassignQuizId}
              >
                {isSubmitting ? "Unassigning..." : "Unassign"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

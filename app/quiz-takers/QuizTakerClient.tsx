/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useMemo, useState, useEffect } from "react";
import {
  Search,
  UserPlus,
  Upload,
  Mail,
  Trash2,
  Send,
  X,
  XCircle,
  Filter,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Check,
  Calendar,
  Users,
  Award,
  Menu,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Sidebar from "../componets/Sidebar";

interface QuestionSet {
  _id: string;
  title: string;
}

interface QuizTaker {
  _id: string;
  email: string;
  name?: string;
  accountType: 'premium' | 'regular';
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
    examType?: 'multi-subject' | 'single-subject';
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
  const router = useRouter();

  // UI States
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [, setShowResultsModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showUnassignModal, setShowUnassignModal] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  // Data States — start empty, populated on mount
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [selectedTakers, setSelectedTakers] = useState<string[]>([]);
  const [quizTakers, setQuizTakers] = useState<QuizTaker[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [questionSets, setQuestionSets] = useState<QuestionSet[]>([]);

  // Filter States
  const [accountTypeFilter, setAccountTypeFilter] = useState<'all' | 'premium' | 'regular'>('all');
  const [subjectFilter, setSubjectFilter] = useState<string[]>([]);
  const [assignedQuizFilter, setAssignedQuizFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Form states
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [selectedQuestionSets, setSelectedQuestionSets] = useState<string[]>([]);
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
          fetch('/api/quiz-takers'),
          fetch('/api/quiz'),
          fetch('/api/questionset'),
        ]);

        const [takersData, quizzesData, setsData] = await Promise.all([
          takersRes.json(),
          quizzesRes.json(),
          setsRes.json(),
        ]);

        setQuizTakers(takersData.quizTakers || []);
        setQuizzes(quizzesData.quizzes || []);
        setQuestionSets(setsData.questionSets || []);
      } catch (err) {
        console.error('Failed to load page data:', err);
      } finally {
        setIsPageLoading(false);
      }
    };

    loadData();
  }, []);

  // ─── Memos ────────────────────────────────────────────────────────────────

  const uniqueCombinations = useMemo(() => {
    const combinations = new Map<string, { ids: string[], titles: string[] }>();

    quizTakers.forEach(taker => {
      if (taker.questionSetCombination && taker.questionSetCombination.length > 0) {
        const ids = taker.questionSetCombination.map(qs => qs._id).sort();
        const titles = taker.questionSetCombination.map(qs => qs.title).sort();
        const key = ids.join(',');

        if (!combinations.has(key)) {
          combinations.set(key, { ids, titles });
        }
      }
    });

    return Array.from(combinations.entries()).map(([key, value]) => ({
      key,
      ids: value.ids,
      titles: value.titles,
      label: value.titles.join(' + ')
    }));
  }, [quizTakers]);

  const assignedQuizzesForFilter = useMemo(() => {
    const quizMap = new Map<string, string>();

    quizTakers.forEach(taker => {
      if (taker.assignedQuizzes && taker.assignedQuizzes.length > 0) {
        taker.assignedQuizzes.forEach((quiz: any) => {
          if (!quizMap.has(quiz._id)) {
            const title = quiz.settings?.title || `Untitled Quiz (${quiz._id.slice(0, 8)})`;
            quizMap.set(quiz._id, title);
          }
        });
      }
    });

    return Array.from(quizMap.entries()).map(([id, title]) => ({ id, title }));
  }, [quizTakers]);

  const filteredQuizTakers = useMemo(() => {
    return quizTakers.filter(taker => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        taker.email.toLowerCase().includes(searchLower) ||
        taker.name?.toLowerCase().includes(searchLower) ||
        taker.accessCode?.toLowerCase().includes(searchLower);

      if (!matchesSearch) return false;

      if (accountTypeFilter !== 'all' && taker.accountType !== accountTypeFilter) return false;

      if (statusFilter !== 'all') {
        if (statusFilter === 'active' && !taker.isActive) return false;
        if (statusFilter === 'inactive' && taker.isActive) return false;
      }

      if (subjectFilter.length > 0) {
        const takerCombination = taker.questionSetCombination
          ?.map(qs => qs._id)
          .sort()
          .join(',') || '';
        if (!subjectFilter.includes(takerCombination)) return false;
      }

      if (assignedQuizFilter !== 'all') {
        if (assignedQuizFilter === 'none') {
          if (taker.assignedQuizzes && taker.assignedQuizzes.length > 0) return false;
        } else {
          const hasQuiz = taker.assignedQuizzes?.some((quiz: any) => quiz._id === assignedQuizFilter);
          if (!hasQuiz) return false;
        }
      }

      if (dateFilter !== 'all') {
        const createdDate = new Date(taker.createdAt);
        const diffDays = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
        if (dateFilter === 'today' && diffDays > 1) return false;
        if (dateFilter === 'week' && diffDays > 7) return false;
        if (dateFilter === 'month' && diffDays > 30) return false;
      }

      return true;
    });
  }, [quizTakers, searchTerm, accountTypeFilter, statusFilter, subjectFilter, assignedQuizFilter, dateFilter]);

  // Reset to page 1 whenever filters/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, accountTypeFilter, statusFilter, subjectFilter, assignedQuizFilter, dateFilter, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredQuizTakers.length / pageSize));

  const paginatedQuizTakers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredQuizTakers.slice(start, start + pageSize);
  }, [filteredQuizTakers, currentPage, pageSize]);

  const compatibleQuizzes = useMemo(() => {
    if (selectedTakers.length === 0) return quizzes;

    const selectedTakerObjects = quizTakers.filter(t => selectedTakers.includes(t._id));

    return quizzes.filter(quiz => {
      const examType = quiz.settings.examType || 'multi-subject';

      if (examType === 'single-subject') {
        const requiredSubjectId = quiz.questionSetCombination[0];
        if (!requiredSubjectId) return false;

        return selectedTakerObjects.every(taker => {
          const takerSubjectIds = taker.questionSetCombination?.map(qs => qs._id) || [];
          return takerSubjectIds.includes(requiredSubjectId);
        });
      } else {
        const firstCombination = selectedTakerObjects[0]?.questionSetCombination
          ? [...selectedTakerObjects[0].questionSetCombination.map(qs => qs._id)].sort()
          : undefined;

        if (!firstCombination) return false;

        const allSameCombination = selectedTakerObjects.every(taker => {
          const takerCombination = taker.questionSetCombination
            ? [...taker.questionSetCombination.map(qs => qs._id)].sort()
            : undefined;
          return JSON.stringify(takerCombination) === JSON.stringify(firstCombination);
        });

        if (!allSameCombination) return false;

        const quizCombination = [...(quiz.questionSetCombination || [])].sort();
        return JSON.stringify(quizCombination) === JSON.stringify(firstCombination);
      }
    });
  }, [selectedTakers, quizTakers, quizzes]);

  const assignedQuizzesForUnassign = useMemo(() => {
    if (selectedTakers.length === 0) return [];

    const quizCountMap = new Map<string, { title: string; count: number }>();
    const selectedTakerObjects = quizTakers.filter(t => selectedTakers.includes(t._id));

    selectedTakerObjects.forEach(taker => {
      taker.assignedQuizzes?.forEach((quiz: any) => {
        const title = quiz.quizId?.settings?.title || `Untitled Quiz (${quiz._id.slice(0, 8)})`;
        const current = quizCountMap.get(quiz.quizId?._id);
        if (current) {
          quizCountMap.set(quiz.quizId?._id, { title, count: current.count + 1 });
        } else {
          quizCountMap.set(quiz.quizId?._id, { title, count: 1 });
        }
      });
    });

    return Array.from(quizCountMap.entries()).map(([id, data]) => ({
      id,
      title: data.title,
      count: data.count
    }));
  }, [selectedTakers, quizTakers]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (accountTypeFilter !== 'all') count++;
    if (statusFilter !== 'all') count++;
    if (subjectFilter.length > 0) count++;
    if (assignedQuizFilter !== 'all') count++;
    if (dateFilter !== 'all') count++;
    return count;
  }, [accountTypeFilter, statusFilter, subjectFilter, assignedQuizFilter, dateFilter]);

  // ─── Helpers ──────────────────────────────────────────────────────────────

  const clearAllFilters = () => {
    setAccountTypeFilter('all');
    setStatusFilter('all');
    setSubjectFilter([]);
    setAssignedQuizFilter('all');
    setDateFilter('all');
  };

  const refreshQuizTakers = async () => {
    const res = await fetch('/api/quiz-takers');
    const data = await res.json();
    setQuizTakers(data.quizTakers || []);
  };

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleQuestionSetToggle = (id: string) => {
    setSelectedQuestionSets(prev => {
      if (prev.includes(id)) return prev.filter(item => item !== id);
      if (prev.length < 4) return [...prev, id];
      return prev;
    });
  };

  const handleSelectAll = () => {
    const pageIds = paginatedQuizTakers.map(t => t._id);
    const allSelected = pageIds.every(id => selectedTakers.includes(id));
    if (allSelected) {
      setSelectedTakers(prev => prev.filter(id => !pageIds.includes(id)));
    } else {
      setSelectedTakers(prev => [...new Set([...prev, ...pageIds])]);
    }
  };

  const handleSelectTaker = (id: string) => {
    setSelectedTakers(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const toggleSubjectFilter = (key: string) => {
    setSubjectFilter(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const handleAddQuizTaker = async () => {
    if (!newEmail.trim()) {
      alert('Please enter an email address');
      return;
    }

    if (selectedQuestionSets.length !== 4) {
      alert('Please select exactly 4 question sets');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const response = await fetch('/api/quiz-takers/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newEmail,
          name: newName || undefined,
          questionSetCombination: selectedQuestionSets
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create student');
      }

      const data = await response.json();
      setQuizTakers(prev => [data.quizTaker, ...prev]);
      setNewEmail('');
      setNewName('');
      setSelectedQuestionSets([]);
      setShowAddModal(false);
      alert(`Premium quiz taker created successfully! Access Code: ${data.quizTaker.accessCode}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create student');
      alert(err instanceof Error ? err.message : 'Failed to create student');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteQuizTaker = async (id: string, email: string) => {
    if (!confirm(`Are you sure you want to delete ${email}?`)) return;

    try {
      const response = await fetch('/api/quiz-takers/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) throw new Error('Failed to delete student');

      setQuizTakers(prev => prev.filter(t => t._id !== id));
      setSelectedTakers(prev => prev.filter(t => t !== id));
      alert('Student deleted successfully');
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete student');
    }
  };

  const handleDeleteSelected = async () => {
    if (!confirm(`Delete ${selectedTakers.length} quiz taker(s)?`)) return;

    try {
      const response = await fetch('/api/quiz-takers/delete-multiple', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedTakers }),
      });

      if (!response.ok) throw new Error('Failed to delete students');

      setQuizTakers(prev => prev.filter(t => !selectedTakers.includes(t._id)));
      setSelectedTakers([]);
      alert('Students deleted successfully');
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete students');
    }
  };

  const handleBulkUpload = async () => {
    if (!importFile) return;

    const formData = new FormData();
    formData.append('file', importFile);

    try {
      setIsSubmitting(true);
      const response = await fetch('/api/quiz-takers/bulk-upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to upload file');

      const data = await response.json();
      setUploadResults(data.results);
      setShowResultsModal(true);
      setShowImportModal(false);
      setImportFile(null);
      await refreshQuizTakers();
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to upload file');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignQuiz = async () => {
    if (!selectedQuizId || selectedTakers.length === 0) return;

    try {
      setIsSubmitting(true);
      const response = await fetch('/api/quiz-takers/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizTakerIds: selectedTakers, quizId: selectedQuizId }),
      });

      if (!response.ok) throw new Error('Failed to assign exam');

      alert('Exam assigned successfully');
      setShowAssignModal(false);
      setSelectedQuizId('');
      await refreshQuizTakers();
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to assign exam');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnassignQuiz = async () => {
    if (!selectedUnassignQuizId || selectedTakers.length === 0) return;

    try {
      setIsSubmitting(true);
      const response = await fetch('/api/quiz-takers/unassign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizTakerIds: selectedTakers, quizId: selectedUnassignQuizId }),
      });

      if (!response.ok) throw new Error('Failed to unassign exam');

      alert('Exam unassigned successfully');
      setShowUnassignModal(false);
      setSelectedUnassignQuizId('');
      await refreshQuizTakers();
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to unassign exam');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendInvites = async () => {
    if (selectedTakers.length === 0) return;

    try {
      setIsSubmitting(true);
      const response = await fetch('/api/quiz-takers/send-invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizTakerIds: selectedTakers }),
      });

      if (!response.ok) throw new Error('Failed to send invites');

      alert(`Invites sent to ${selectedTakers.length} quiz taker(s)`);
      setSelectedTakers([]);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to send invites');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      const response = await fetch(`/api/quiz-takers/${id}/update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentActive }),
      });

      if (!response.ok) throw new Error('Failed to update status');

      setQuizTakers(prev => prev.map(t =>
        t._id === id ? { ...t, isActive: !currentActive } : t
      ));
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  // ─── Page loading skeleton ─────────────────────────────────────────────────
  if (isPageLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
            <div className="hidden lg:block lg:col-span-3">
              <Sidebar />
            </div>
            <div className="lg:col-span-9 space-y-4">
              {/* Header skeleton */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-1/4 mb-4" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-20 bg-gray-200 rounded-lg" />
                  ))}
                </div>
              </div>
              {/* Table skeleton */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-pulse">
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                    <div key={i} className="h-12 bg-gray-200 rounded" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Main render (unchanged from your original) ────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
          {/* Mobile Sidebar Toggle */}
          <button
            className="lg:hidden fixed top-4 left-4 p-2 bg-white rounded-lg shadow-md"
            onClick={() => setShowMobileSidebar(true)}
          >
            <Menu className="w-6 h-6 text-gray-600" />
          </button>

          {/* Sidebar - Desktop */}
          <div className="hidden lg:block lg:col-span-3">
            <Sidebar />
          </div>

          {/* Mobile Sidebar */}
          {showMobileSidebar && (
            <div className="lg:hidden fixed inset-0 z-50 flex">
              <div className="bg-white w-80 h-full overflow-y-auto">
                <div className="p-4 flex justify-end">
                  <button onClick={() => setShowMobileSidebar(false)}>
                    <X className="w-6 h-6 text-gray-600" />
                  </button>
                </div>
                <Sidebar />
              </div>
              <div
                className="flex-1 bg-black/50"
                onClick={() => setShowMobileSidebar(false)}
              />
            </div>
          )}

          {/* Main Content */}
          <div className="lg:col-span-9">
            {/* Header */}
            <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6 mb-4 md:mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Students</h1>
                  <p className="text-sm text-gray-500 mt-1">Manage your students and assignments</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="flex-1 sm:flex-none px-4 py-2 bg-green-bg text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span className="hidden sm:inline">Add Premium Student</span>
                    <span className="sm:hidden">Add Student</span>
                  </button>
                  <button
                    onClick={() => setShowImportModal(true)}
                    className="flex-1 sm:flex-none px-4 py-2 bg-blue-bg text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Import
                  </button>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
                <div className="bg-blue-50 rounded-lg p-3 md:p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="w-4 h-4 text-blue-600" />
                    <p className="text-xs text-blue-600 font-medium">Total</p>
                  </div>
                  <p className="text-xl md:text-2xl font-bold text-blue-900">{quizTakers.length}</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-3 md:p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Award className="w-4 h-4 text-purple-600" />
                    <p className="text-xs text-purple-600 font-medium">Premium</p>
                  </div>
                  <p className="text-xl md:text-2xl font-bold text-purple-900">
                    {quizTakers.filter(t => t.accountType === 'premium').length}
                  </p>
                </div>
                <div className="bg-green-50 rounded-lg p-3 md:p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Check className="w-4 h-4 text-green-600" />
                    <p className="text-xs text-green-600 font-medium">Active</p>
                  </div>
                  <p className="text-xl md:text-2xl font-bold text-green-900">
                    {quizTakers.filter(t => t.isActive).length}
                  </p>
                </div>
                <div className="bg-orange-50 rounded-lg p-3 md:p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-4 h-4 text-orange-600" />
                    <p className="text-xs text-orange-600 font-medium">This Week</p>
                  </div>
                  <p className="text-xl md:text-2xl font-bold text-orange-900">
                    {quizTakers.filter(t => {
                      const diffTime = Date.now() - new Date(t.createdAt).getTime();
                      return diffTime < 7 * 24 * 60 * 60 * 1000;
                    }).length}
                  </p>
                </div>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6 mb-4 md:mb-6">
              {/* Search Bar */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by email, name, or access code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              {/* Filter Toggle Button - Mobile */}
              <button
                onClick={() => setShowFilterPanel(!showFilterPanel)}
                className="w-full md:hidden flex items-center justify-between px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg mb-3"
              >
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Filters</span>
                  {activeFilterCount > 0 && (
                    <span className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                      {activeFilterCount}
                    </span>
                  )}
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-gray-600 transition-transform ${showFilterPanel ? 'rotate-180' : ''
                    }`}
                />
              </button>

              {/* Filters Panel - Responsive */}
              <div className={`${showFilterPanel ? 'block' : 'hidden'} md:block space-y-4`}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {/* Account Type Filter */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Account Type
                    </label>
                    <select
                      value={accountTypeFilter}
                      onChange={(e) => setAccountTypeFilter(e.target.value as any)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Exams</option>
                      <option value="none">No Exam Assigned</option>
                      {assignedQuizzesForFilter.map(quiz => (
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
                      {uniqueCombinations.map(combo => (
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
              <div className="mt-4 pt-4 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <p className="text-sm text-gray-600">
                  Showing <span className="font-semibold">{Math.min((currentPage - 1) * pageSize + 1, filteredQuizTakers.length) || 0}–{Math.min(currentPage * pageSize, filteredQuizTakers.length)}</span> of{' '}
                  <span className="font-semibold">{filteredQuizTakers.length}</span> students
                </p>

                {/* Bulk Actions - Only show when items selected */}
                {selectedTakers.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={handleSendInvites}
                      disabled={isSubmitting}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      Send Invites ({selectedTakers.length})
                    </button>
                    <button
                      onClick={() => setShowAssignModal(true)}
                      disabled={isSubmitting}
                      className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Assign Quiz
                    </button>
                    <button
                      onClick={() => setShowUnassignModal(true)}
                      disabled={isSubmitting}
                      className="px-3 py-1.5 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Unassign
                    </button>
                    <button
                      onClick={handleDeleteSelected}
                      disabled={isSubmitting}
                      className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Quiz Takers Table - Responsive */}
            <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={paginatedQuizTakers.length > 0 && paginatedQuizTakers.every(t => selectedTakers.includes(t._id))}
                          onChange={handleSelectAll}
                          className="rounded border-gray-300"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Access Code
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Subjects
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Exams
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredQuizTakers.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center justify-center">
                            <Users className="w-12 h-12 text-gray-300 mb-3" />
                            <p className="text-gray-500 font-medium">No students found</p>
                            <p className="text-sm text-gray-400 mt-1">
                              {searchTerm || activeFilterCount > 0
                                ? 'Try adjusting your filters'
                                : 'Add your first student to get started'}
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      paginatedQuizTakers.map((taker) => (
                        <tr key={taker._id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <input
                              type="checkbox"
                              checked={selectedTakers.includes(taker._id)}
                              onChange={() => handleSelectTaker(taker._id)}
                              className="rounded border-gray-300"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {taker.name || 'No Name'}
                              </p>
                              <p className="text-sm text-gray-500">{taker.email}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${taker.accountType === 'premium'
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-gray-100 text-gray-700'
                                }`}
                            >
                              {taker.accountType}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={taker.isActive}
                                onChange={() => handleToggleActive(taker._id, taker.isActive)}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                              <span className={`ml-3 text-sm font-medium ${taker.isActive ? 'text-green-700' : 'text-red-700'}`}>
                                {taker.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </label>
                          </td>
                          <td className="px-6 py-4">
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                              {taker.accessCode || 'N/A'}
                            </code>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-xs text-gray-600">
                              {taker.questionSetCombination && taker.questionSetCombination.length > 0 ? (
                                <div className="space-y-1">
                                  {taker.questionSetCombination.slice(0, 2).map((qs, idx) => (
                                    <div key={idx} className="truncate max-w-xs">
                                      {qs.title}
                                    </div>
                                  ))}
                                  {taker.questionSetCombination.length > 2 && (
                                    <div className="text-gray-400">
                                      +{taker.questionSetCombination.length - 2} more
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-gray-400">None</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-gray-600">
                              {taker.assignedQuizzes?.length || 0} assigned
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => {
                                  setSelectedTakers([taker._id]);
                                  handleSendInvites();
                                }}
                                className="text-blue-600 hover:text-blue-700 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                                title="Send Invite"
                              >
                                <Mail className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedTakers([taker._id]);
                                  setShowUnassignModal(true);
                                }}
                                className="text-orange-600 hover:text-orange-700 p-2 rounded-lg hover:bg-orange-50 transition-colors"
                                title="Unassign"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteQuizTaker(taker._id, taker.email)}
                                className="text-red-600 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors"
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
                    <p className="text-gray-500 font-medium">No students found</p>
                    <p className="text-sm text-gray-400 mt-1">
                      {searchTerm || activeFilterCount > 0
                        ? 'Try adjusting your filters'
                        : 'Add your first student to get started'}
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
                              {taker.name || 'No Name'}
                            </p>
                            <p className="text-xs text-gray-500 truncate">{taker.email}</p>
                          </div>

                          {/* Badges */}
                          <div className="flex flex-wrap gap-2 mb-3">
                            <span
                              className={`px-2 py-0.5 text-xs font-medium rounded-full ${taker.accountType === 'premium'
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-gray-100 text-gray-700'
                                }`}
                            >
                              {taker.accountType}
                            </span>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={taker.isActive}
                                onChange={() => handleToggleActive(taker._id, taker.isActive)}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                              <span className={`ml-3 text-xs font-medium ${taker.isActive ? 'text-green-700' : 'text-red-700'}`}>
                                {taker.isActive ? 'Active' : 'Inactive'}
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
                              <span className="text-gray-500">Assigned Exams:</span>
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
                            onClick={() => handleDeleteQuizTaker(taker._id, taker.email)}
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
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 md:px-6 py-4 border-t border-gray-200 bg-gray-50">
                  {/* Page size selector + info */}
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <span>Rows per page:</span>
                    <select
                      value={pageSize}
                      onChange={(e) => setPageSize(Number(e.target.value))}
                      className="px-2 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {[10, 20, 50, 100].map(n => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                    <span className="hidden sm:inline">
                      {Math.min((currentPage - 1) * pageSize + 1, filteredQuizTakers.length)}–
                      {Math.min(currentPage * pageSize, filteredQuizTakers.length)} of {filteredQuizTakers.length}
                    </span>
                  </div>

                  {/* Page controls */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      title="First page"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                    >
                      Prev
                    </button>

                    {/* Page number buttons */}
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(p =>
                          p === 1 ||
                          p === totalPages ||
                          Math.abs(p - currentPage) <= 1
                        )
                        .reduce<(number | 'ellipsis')[]>((acc, p, idx, arr) => {
                          if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('ellipsis');
                          acc.push(p);
                          return acc;
                        }, [])
                        .map((item, idx) =>
                          item === 'ellipsis' ? (
                            <span key={`ellipsis-${idx}`} className="px-1 text-gray-400 text-sm">…</span>
                          ) : (
                            <button
                              key={item}
                              onClick={() => setCurrentPage(item as number)}
                              className={`min-w-[32px] px-2 py-1.5 rounded-lg text-sm font-medium transition-colors ${currentPage === item
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                              {item}
                            </button>
                          )
                        )}
                    </div>

                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                    >
                      Next
                    </button>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      title="Last page"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

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
                    setNewEmail('');
                    setNewName('');
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
                      className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${selectedQuestionSets.includes(qs._id)
                        ? 'bg-indigo-50 border-2 border-indigo-500'
                        : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                        }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedQuestionSets.includes(qs._id)}
                        onChange={() => handleQuestionSetToggle(qs._id)}
                        disabled={isSubmitting || (!selectedQuestionSets.includes(qs._id) && selectedQuestionSets.length >= 4)}
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
                  setNewEmail('');
                  setNewName('');
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
                  setSelectedQuizId('');
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
                No compatible exams found. Selected students have different subject combinations.
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
                    {quiz.settings.title || `Untitled Exam (${quiz._id.slice(0, 8)})`}
                  </option>
                ))}
              </select>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedQuizId('');
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
                  setSelectedUnassignQuizId('');
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
                    {quiz.title} ({quiz.count} of {selectedTakers.length} selected)
                  </option>
                ))}
              </select>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowUnassignModal(false);
                  setSelectedUnassignQuizId('');
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
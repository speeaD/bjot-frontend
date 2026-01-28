/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useMemo, useState } from "react";
import { Search, UserPlus, Upload, Mail, Trash2, Send, X, XCircle } from "lucide-react";
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
  };
  questionSetCombination: string[];
}

interface Props {
  initialQuizTakers: QuizTaker[];
  quizzes: Quiz[];
  questionSets: QuestionSet[];
}

interface BulkUploadResult {
  row: number;
  email: string;
  accountType?: string;
  accessCode?: string;
  reason?: string;
}

export default function QuizTakersClient({ initialQuizTakers, quizzes, questionSets }: Props) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [, setShowResultsModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showUnassignModal, setShowUnassignModal] = useState(false);
  const [selectedTakers, setSelectedTakers] = useState<string[]>([]);
  const [quizTakers, setQuizTakers] = useState<QuizTaker[]>(initialQuizTakers);
  const [accountTypeFilter, setAccountTypeFilter] = useState<'all' | 'premium' | 'regular'>('all');
  const [subjectFilter, setSubjectFilter] = useState<string[]>([]);
  const [assignedQuizFilter, setAssignedQuizFilter] = useState<string>('all');
  
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

  // Get unique subject combinations
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

  // Get list of assigned quizzes for filter dropdown
  const assignedQuizzesForFilter = useMemo(() => {
    const quizMap = new Map<string, string>();
    
    quizTakers.forEach(taker => {
      if (taker.assignedQuizzes && taker.assignedQuizzes.length > 0) {
        taker.assignedQuizzes.forEach((quiz: any) => {
          if (!quizMap.has(quiz._id)) {
            quizMap.set(quiz._id, quiz.settings?.title || 'Untitled Quiz');
          }
        });
      }
    });
    
    return Array.from(quizMap.entries()).map(([id, title]) => ({ id, title }));
  }, [quizTakers]);

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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: newEmail,
          name: newName || undefined,
          questionSetCombination: selectedQuestionSets
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create quiz taker');
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
      setError(err instanceof Error ? err.message : 'Failed to create quiz taker');
      alert(err instanceof Error ? err.message : 'Failed to create quiz taker');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteQuizTaker = async (id: string, email: string) => {
    if (!confirm(`Are you sure you want to delete ${email}?`)) return;

    try {
      const response = await fetch('/api/quiz-takers/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) throw new Error('Failed to delete quiz taker');

      setQuizTakers(prev => prev.filter(t => t._id !== id));
      setSelectedTakers(prev => prev.filter(t => t !== id));
      
      alert('Quiz taker deleted successfully');
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete quiz taker');
    }
  };

  const handleDeleteSelected = async () => {
    if (!confirm(`Delete ${selectedTakers.length} quiz taker(s)?`)) return;

    try {
      const response = await fetch('/api/quiz-takers/delete-multiple', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids: selectedTakers }),
      });

      if (!response.ok) throw new Error('Failed to delete quiz takers');

      setQuizTakers(prev => prev.filter(t => !selectedTakers.includes(t._id)));
      setSelectedTakers([]);
      
      alert('Quiz takers deleted successfully');
      router.refresh();
    } catch (e) {
      alert('Failed to delete some quiz takers: ' + (e instanceof Error ? e.message : 'Unknown error'));
    }
  };

  const handleBulkUpload = async () => {
    if (!importFile) {
      alert('Please select a file to upload');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      
      const formData = new FormData();
      formData.append('file', importFile);

      const response = await fetch('/api/quiz-takers/bulk-upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to upload file');
      }

      setUploadResults(data.results);
      setShowResultsModal(true);
      setImportFile(null);
      setShowImportModal(false);
      
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload file');
      alert(err instanceof Error ? err.message : 'Failed to upload file');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignQuiz = async () => {
    if (!selectedQuizId) {
      alert('Please select a quiz');
      return;
    }

    if (selectedTakers.length === 0) {
      alert('Please select quiz takers');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const response = await fetch('/api/quiz-takers/assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quizId: selectedQuizId,
          quizTakerIds: selectedTakers,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to assign quiz');
      }

      const data = await response.json();
      
      setSelectedQuizId('');
      setSelectedTakers([]);
      setShowAssignModal(false);
      
      if (data.results) {
        const successCount = data.results.success?.length || 0;
        const failCount = data.results.failed?.length || 0;
        
        let message = `Successfully assigned to ${successCount} quiz taker(s)`;
        if (failCount > 0) {
          message += `\n\nFailed for ${failCount} quiz taker(s):`;
          data.results.failed.forEach((f: any) => {
            message += `\n- ${f.reason}`;
          });
        }
        alert(message);
      } else {
        alert(`Quiz assigned successfully to ${selectedTakers.length} quiz taker(s)`);
      }
      
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to assign quiz');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnassignQuiz = async () => {
    if (!selectedUnassignQuizId) {
      alert('Please select a quiz to unassign');
      return;
    }

    if (selectedTakers.length === 0) {
      alert('Please select quiz takers');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const response = await fetch('/api/quiz-takers/unassign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quizId: selectedUnassignQuizId,
          quizTakerIds: selectedTakers,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to unassign quiz');
      }

      const data = await response.json();
      
      setSelectedUnassignQuizId('');
      setSelectedTakers([]);
      setShowUnassignModal(false);
      
      if (data.results) {
        const successCount = data.results.success?.length || 0;
        const failCount = data.results.failed?.length || 0;
        
        let message = `Successfully unassigned from ${successCount} quiz taker(s)`;
        if (failCount > 0) {
          message += `\n\nFailed for ${failCount} quiz taker(s):`;
          data.results.failed.forEach((f: any) => {
            message += `\n- ${f.reason}`;
          });
        }
        alert(message);
      } else {
        alert(`Quiz unassigned successfully from ${selectedTakers.length} quiz taker(s)`);
      }
      
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to unassign quiz');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendInvitation = async (email: string, accessCode: string) => {
    try {
      const response = await fetch('/api/quiz-takers/send-invitation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, accessCode }),
      });

      if (!response.ok) throw new Error('Failed to send invitation');

      alert(`Invitation sent to ${email}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to send invitation');
    }
  };

  const handleQuestionSetToggle = (questionSetId: string) => {
    setSelectedQuestionSets(prev => {
      if (prev.includes(questionSetId)) {
        return prev.filter(id => id !== questionSetId);
      } else if (prev.length < 4) {
        return [...prev, questionSetId];
      } else {
        alert('You can only select 4 question sets');
        return prev;
      }
    });
  };

  const handleSubjectFilterToggle = (combinationKey: string) => {
    setSubjectFilter(prev => {
      if (prev.includes(combinationKey)) {
        return prev.filter(key => key !== combinationKey);
      } else {
        return [...prev, combinationKey];
      }
    });
  };

  const clearSubjectFilter = () => {
    setSubjectFilter([]);
  };

  const filteredTakers = useMemo(() => {
    return quizTakers
      .filter(taker => accountTypeFilter === 'all' || taker.accountType === accountTypeFilter)
      .filter(taker => {
        if (subjectFilter.length === 0) return true;
        
        if (!taker.questionSetCombination || taker.questionSetCombination.length === 0) {
          return false;
        }
        
        const takerCombinationKey = taker.questionSetCombination
          .map(qs => qs._id)
          .sort()
          .join(',');
        
        return subjectFilter.includes(takerCombinationKey);
      })
      .filter(taker => {
        // Filter by assigned quiz
        if (assignedQuizFilter === 'all') return true;
        if (assignedQuizFilter === 'none') {
          return !taker.assignedQuizzes || taker.assignedQuizzes.length === 0;
        }
        // Check if taker has the specific quiz assigned
        return taker.assignedQuizzes?.some((quiz: any) => quiz._id === assignedQuizFilter);
      })
      .filter(
        (taker) =>
          taker.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (taker.accessCode && taker.accessCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (taker.name && taker.name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
  }, [quizTakers, accountTypeFilter, subjectFilter, assignedQuizFilter, searchTerm]);

  const getCompatibleQuizzes = () => {
    if (selectedTakers.length === 0) return quizzes;

    const selectedTakerData = quizTakers.filter(t => selectedTakers.includes(t._id));
    
    const firstTakerCombination = selectedTakerData[0]?.questionSetCombination?.map(qs => qs._id).sort().join(',');
    
    const allSameCombination = selectedTakerData.every(taker => {
      const takerCombination = taker.questionSetCombination?.map(qs => qs._id).sort().join(',');
      return takerCombination === firstTakerCombination;
    });

    if (!allSameCombination) {
      return [];
    }

    return quizzes.filter(quiz => {
      const quizCombination = quiz.questionSetCombination.sort().join(',');
      return quizCombination === firstTakerCombination;
    });
  };

  // Get quizzes that are currently assigned to selected takers for unassign modal
  const getAssignedQuizzesForUnassign = () => {
    if (selectedTakers.length === 0) return [];

    const selectedTakerData = quizTakers.filter(t => selectedTakers.includes(t._id));
    
    // Find quizzes that are assigned to at least one selected taker
    const assignedQuizMap = new Map<string, { id: string, title: string, count: number }>();
    
    selectedTakerData.forEach(taker => {
      if (taker.assignedQuizzes && taker.assignedQuizzes.length > 0) {
        taker.assignedQuizzes.forEach((quiz: any) => {
          const existing = assignedQuizMap.get(quiz._id);
          if (existing) {
            existing.count++;
          } else {
            assignedQuizMap.set(quiz._id, {
              id: quiz._id,
              title: quiz.settings?.title || 'Untitled Quiz',
              count: 1
            });
          }
        });
      }
    });
    
    return Array.from(assignedQuizMap.values());
  };

  const compatibleQuizzes = getCompatibleQuizzes();
  const assignedQuizzesForUnassign = getAssignedQuizzesForUnassign();

  const handleSelectTaker = (id: string) => {
    setSelectedTakers((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedTakers.length === filteredTakers.length) {
      setSelectedTakers([]);
    } else {
      setSelectedTakers(filteredTakers.map((t) => t._id));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-3 py-8">
        <div className="grid grid-cols-12 gap-6">
          <Sidebar />

          <div className="col-span-9">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-800">
                      Exam Takers
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Total: {quizTakers.length} exam takers
                      {accountTypeFilter !== 'all' && ` (${accountTypeFilter})`}
                      {subjectFilter.length > 0 && ` - ${filteredTakers.length} matching filters`}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowImportModal(true)}
                      className="px-4 py-2 bg-blue-bg text-white rounded-lg font-medium hover:bg-indigo-700 flex items-center"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Import
                    </button>
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="px-4 py-2 bg-green-bg text-white rounded-lg font-medium hover:bg-green-700 flex items-center"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add Premium Student
                    </button>
                  </div>
                </div>

                {/* Account Type Filter */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setAccountTypeFilter('all')}
                      className={`px-3 py-1 rounded-lg text-sm font-medium ${
                        accountTypeFilter === 'all'
                          ? 'bg-blue-bg text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setAccountTypeFilter('premium')}
                      className={`px-3 py-1 rounded-lg text-sm font-medium ${
                        accountTypeFilter === 'premium'
                          ? 'bg-blue-bg text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Premium
                    </button>
                    <button
                      onClick={() => setAccountTypeFilter('regular')}
                      className={`px-3 py-1 rounded-lg text-sm font-medium ${
                        accountTypeFilter === 'regular'
                          ? 'bg-blue-bg text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Regular
                    </button>
                  </div>
                </div>

                {/* Subject Combination Filter */}
                {uniqueCombinations.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-gray-700">
                        Filter by Subject Combination
                      </label>
                      {subjectFilter.length > 0 && (
                        <button
                          onClick={clearSubjectFilter}
                          className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          <X className="w-3 h-3" />
                          Clear filters
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {uniqueCombinations.map((combo) => (
                        <button
                          key={combo.key}
                          onClick={() => handleSubjectFilterToggle(combo.key)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            subjectFilter.includes(combo.key)
                              ? 'bg-indigo-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {combo.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Assigned Quiz Filter */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Filter by Assigned Quiz
                  </label>
                  <select
                    value={assignedQuizFilter}
                    onChange={(e) => setAssignedQuizFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Quiz Takers</option>
                    <option value="none">No Assigned Quizzes</option>
                    {assignedQuizzesForFilter.map(quiz => (
                      <option key={quiz.id} value={quiz.id}>
                        {quiz.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Search and Actions */}
                <div className="flex items-center justify-between gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search by email, name, or access code..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  {selectedTakers.length > 0 && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowAssignModal(true)}
                        className="px-4 py-2 bg-blue-bg text-white rounded-lg font-medium hover:bg-indigo-700 flex items-center"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Assign Quiz ({selectedTakers.length})
                      </button>
                      <button
                        onClick={() => setShowUnassignModal(true)}
                        className="px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 flex items-center"
                        disabled={assignedQuizzesForUnassign.length === 0}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Unassign Quiz ({selectedTakers.length})
                      </button>
                      <button
                        onClick={handleDeleteSelected}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 flex items-center"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete ({selectedTakers.length})
                      </button>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error}
                  </div>
                )}
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-3 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={
                            selectedTakers.length === filteredTakers.length &&
                            filteredTakers.length > 0
                          }
                          onChange={handleSelectAll}
                          className="rounded border-gray-300"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Access Code
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Question Sets
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Assigned
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredTakers.map((taker) => (
                      <tr key={taker._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedTakers.includes(taker._id)}
                            onChange={() => handleSelectTaker(taker._id)}
                            className="rounded border-gray-300"
                          />
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              taker.accountType === 'premium'
                                ? "bg-purple-100 text-purple-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {taker.accountType === 'premium' ? 'Premium' : 'Regular'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {taker.email}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {taker.name || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {taker.accessCode ? (
                            <code className="px-2 py-1 bg-gray-100 rounded text-blue-600 font-mono">
                              {taker.accessCode}
                            </code>
                          ) : (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {taker.questionSetCombination && taker.questionSetCombination.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {taker.questionSetCombination.slice(0, 2).map((qs) => (
                                <span
                                  key={qs._id}
                                  className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs"
                                  title={qs.title}
                                >
                                  {qs.title}
                                </span>
                              ))}
                              {taker.questionSetCombination.length > 2 && (
                                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                                  +{taker.questionSetCombination.length - 2}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400">Not set</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              taker.isActive
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {taker.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {taker.accountType === 'premium' ? (taker.assignedQuizzes?.length || 0) : '-'}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex gap-2">
                            {taker.accountType === 'premium' && taker.accessCode && (
                              <button
                                onClick={() =>
                                  handleSendInvitation(taker.email, taker.accessCode!)
                                }
                                className="text-blue-600 hover:text-blue-800"
                                title="Send invitation"
                              >
                                <Mail className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() =>
                                handleDeleteQuizTaker(taker._id, taker.email)
                              }
                              className="text-red-600 hover:text-red-800"
                              title="Delete quiz taker"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredTakers.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500">
                    {searchTerm
                      ? "No quiz takers found matching your search"
                      : "No quiz takers yet. Add your first quiz taker to get started."}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4">Add Premium Quiz Taker</h3>
            <p className="text-sm text-gray-600 mb-6">
              Enter the details and select exactly 4 question sets. An access code will be generated automatically.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  placeholder="student@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Question Set Combination * (Select exactly 4)
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

            <div className="flex justify-end gap-3 mt-6">
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
        <div className="fixed inset-0 bg-black/80 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">
              Import Quiz Takers
            </h3>
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
        <div className="fixed inset-0 bg-black/80 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Assign Quiz</h3>
            <p className="text-sm text-gray-600 mb-4">
              Select a quiz to assign to {selectedTakers.length} quiz taker(s)
            </p>
            {compatibleQuizzes.length === 0 && selectedTakers.length > 0 ? (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
                No compatible quizzes found. Selected quiz takers have different question set combinations.
              </div>
            ) : (
              <select
                value={selectedQuizId}
                onChange={(e) => setSelectedQuizId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSubmitting}
              >
                <option value="">Select a quiz...</option>
                {compatibleQuizzes.map((quiz) => (
                  <option key={quiz._id} value={quiz._id}>
                    {quiz.settings.title}
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
        <div className="fixed inset-0 bg-black/80 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Unassign Quiz</h3>
            <p className="text-sm text-gray-600 mb-4">
              Select a quiz to unassign from {selectedTakers.length} quiz taker(s)
            </p>
            {assignedQuizzesForUnassign.length === 0 ? (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
                No assigned quizzes found for the selected quiz takers.
              </div>
            ) : (
              <select
                value={selectedUnassignQuizId}
                onChange={(e) => setSelectedUnassignQuizId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-orange-500"
                disabled={isSubmitting}
              >
                <option value="">Select a quiz to unassign...</option>
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
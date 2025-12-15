/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { Search, UserPlus, Upload, Mail, Trash2, Send} from "lucide-react";
import { useRouter } from "next/navigation";
import Sidebar from "../componets/Sidebar";

interface QuizTaker {
  _id: string;
  email: string;
  accessCode: string;
  isActive: boolean;
  quizzesTaken?: number;
  assignedQuizzes?: any[];
  createdAt: string;
}

interface Quiz {
  _id: string;
  settings: {
    title: string;
  };
}

interface Props {
  initialQuizTakers: QuizTaker[];
  quizzes: Quiz[];
}

export default function QuizTakersClient({ initialQuizTakers, quizzes }: Props) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedTakers, setSelectedTakers] = useState<string[]>([]);
  const [quizTakers, setQuizTakers] = useState<QuizTaker[]>(initialQuizTakers);
  
  // Form states
  const [newEmail, setNewEmail] = useState("");
  const [selectedQuizId, setSelectedQuizId] = useState("");
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddQuizTaker = async () => {
    if (!newEmail.trim()) {
      alert('Please enter an email address');
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
        body: JSON.stringify({ email: newEmail }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create quiz taker');
      }

      const data = await response.json();
      
      // Add new quiz taker to the list
      setQuizTakers(prev => [data.quizTaker, ...prev]);
      setNewEmail('');
      setShowAddModal(false);
      
      alert(`Quiz taker created successfully! Access Code: ${data.quizTaker.accessCode}`);
      
      // Refresh server data
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

      // Remove from list
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

      // Remove from list
      setQuizTakers(prev => prev.filter(t => !selectedTakers.includes(t._id)));
      setSelectedTakers([]);
      
      alert('Quiz takers deleted successfully');
      router.refresh();
    } catch (e) {
      alert('Failed to delete some quiz takers: ' + (e instanceof Error ? e.message : 'Unknown error'));
    }
  };

  const handleImportQuizTakers = async () => {
    if (!importFile) {
      alert('Please select a file to import');
      return;
    }

    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append('file', importFile);

      const response = await fetch('/api/quiz-takers/import', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to import quiz takers');

      const data = await response.json();
      
      setImportFile(null);
      setShowImportModal(false);
      
      alert(`Successfully imported ${data.imported || 0} quiz takers`);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to import quiz takers');
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

      if (!response.ok) throw new Error('Failed to assign quiz');
      
      setSelectedQuizId('');
      setSelectedTakers([]);
      setShowAssignModal(false);
      
      alert(`Quiz assigned successfully to ${selectedTakers.length} quiz taker(s)`);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to assign quiz');
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

  const filteredTakers = quizTakers.filter(
    (taker) =>
      taker.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      taker.accessCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          {/* Left Sidebar */}
          <Sidebar />

          {/* Main Content */}
          <div className="col-span-9">
            <div className="bg-white rounded-lg shadow">
              {/* Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-800">
                      Quiz Takers
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Total: {quizTakers.length} quiz takers
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
                      Add Quiz Taker
                    </button>
                  </div>
                </div>

                {/* Search and Actions */}
                <div className="flex items-center justify-between gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search by email or access code..."
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
                        Assign Quiz
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
                      <th className="px-6 py-3 text-left">
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
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Access Code
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Assigned Quizzes
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
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {taker.email}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <code className="px-2 py-1 bg-gray-100 rounded text-blue-600 font-mono">
                            {taker.accessCode}
                          </code>
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
                          {taker.assignedQuizzes?.length || 0}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex gap-2">
                            <button
                              onClick={() =>
                                handleSendInvitation(taker.email, taker.accessCode)
                              }
                              className="text-blue-600 hover:text-blue-800"
                              title="Send invitation"
                            >
                              <Mail className="w-4 h-4" />
                            </button>
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
        <div className="fixed inset-0 bg-black/80 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Add Quiz Taker</h3>
            <p className="text-sm text-gray-600 mb-4">
              Enter the email address of the quiz taker. An access code will be
              generated automatically.
            </p>
            <input
              type="email"
              placeholder="Email address"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSubmitting}
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewEmail('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleAddQuizTaker}
                className="px-4 py-2 bg-green-bg text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Adding..." : "Add"}
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
                onClick={handleImportQuizTakers}
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
            <select
              value={selectedQuizId}
              onChange={(e) => setSelectedQuizId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSubmitting}
            >
              <option value="">Select a quiz...</option>
              {quizzes.map((quiz) => (
                <option key={quiz._id} value={quiz._id}>
                  {quiz.settings.title}
                </option>
              ))}
            </select>
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
    </div>
  );
}
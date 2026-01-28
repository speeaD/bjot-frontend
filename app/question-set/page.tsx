'use client';

import { useState, useEffect } from 'react';
import { Upload, Search, FileText, Award, Trash2, Eye, Download } from 'lucide-react';
import Sidebar from '../componets/Sidebar';

interface QuestionSet {
    _id: string;
    title: string;
    questionCount: number;
    totalPoints: number;
    isActive: boolean;
    createdAt: string;
    createdBy: {
        email: string;
    };
}

export default function ManageQuestionSets() {
    const [questionSets, setQuestionSets] = useState<QuestionSet[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showUploadModal, setShowUploadModal] = useState(false);

    // Upload form state
    const [uploadTitle, setUploadTitle] = useState('');
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        fetchQuestionSets();
    }, []);

    const fetchQuestionSets = async () => {
        try {
            setIsLoading(true);
            const response = await fetch('/api/questionset');
            const data = await response.json();

            if (data.success) {
                setQuestionSets(data.questionSets || []);
            }
        } catch (error) {
            console.error('Error fetching question sets:', error);
            alert('Failed to load question sets');
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!uploadTitle.trim()) {
            alert('Please enter a title for the question set');
            return;
        }

        if (!uploadFile) {
            alert('Please select a file to upload');
            return;
        }

        try {
            setIsUploading(true);
            const formData = new FormData();
            formData.append('title', uploadTitle);
            formData.append('file', uploadFile);

            const response = await fetch('/api/questionset/bulk-upload', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to upload question set');
            }

            alert(`Question set uploaded successfully! ${data.questionSet.questionCount} questions added.`);
            setShowUploadModal(false);
            setUploadTitle('');
            setUploadFile(null);
            fetchQuestionSets();
        } catch (error) {
            console.error('Error uploading question set:', error);
            alert(error instanceof Error ? error.message : 'Failed to upload question set');
        } finally {
            setIsUploading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this question set?')) {
            return;
        }

        try {
            const response = await fetch(`/api/questionset/${id}`, {
                method: 'DELETE',
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to delete question set');
            }

            alert('Question set deleted successfully');
            fetchQuestionSets();
        } catch (error) {
            console.error('Error deleting question set:', error);
            alert(error instanceof Error ? error.message : 'Failed to delete question set');
        }
    };

    const handleToggleActive = async (id: string) => {
        try {
            const response = await fetch(`/api/questionset/${id}/toggle-active`, {
                method: 'PATCH',
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to update question set');
            }

            fetchQuestionSets();
        } catch (error) {
            console.error('Error toggling active status:', error);
            alert('Failed to update question set');
        }
    };

    const downloadTemplate = () => {
        window.open('/api/questionset/template/download', '_blank');
    };

    const filteredSets = questionSets.filter(qs =>
        qs.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-12 gap-6">
                    {/* Left Sidebar */}
                    <Sidebar />

                    {/* Main Content */}
                    <div className="col-span-9">
                        <div className="bg-white rounded-lg shadow"></div>
                        {/* Header */}
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">Question Sets</h1>
                                <p className="text-gray-600 mt-1">Manage reusable question sets for your exams</p>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={downloadTemplate}
                                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    <Download className="w-5 h-5" />
                                    Download Template
                                </button>
                                <button
                                    onClick={() => setShowUploadModal(true)}
                                    className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                                >
                                    <Upload className="w-5 h-5" />
                                    Upload Question Set
                                </button>
                            </div>
                        </div>

                        {/* Search */}
                        <div className="mb-6">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder="Search question sets..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        </div>

                        {/* Question Sets Grid */}
                        {isLoading ? (
                            <div className="text-center py-12">
                                <p className="text-gray-600">Loading question sets...</p>
                            </div>
                        ) : filteredSets.length === 0 ? (
                            <div className="text-center py-12 bg-white rounded-lg shadow">
                                <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">No question sets found</h3>
                                <p className="text-gray-600 mb-6">
                                    {searchTerm ? 'Try a different search term' : 'Upload your first question set to get started'}
                                </p>
                                {!searchTerm && (
                                    <button
                                        onClick={() => setShowUploadModal(true)}
                                        className="inline-flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                                    >
                                        <Upload className="w-5 h-5" />
                                        Upload Question Set
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredSets.map((questionSet) => (
                                    <div
                                        key={questionSet._id}
                                        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex-1">
                                                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                                    {questionSet.title}
                                                </h3>
                                                <p className="text-sm text-gray-500">
                                                    Created {new Date(questionSet.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <span
                                                className={`px-2 py-1 text-xs font-medium rounded ${questionSet.isActive
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-gray-100 text-gray-800'
                                                    }`}
                                            >
                                                {questionSet.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>

                                        <div className="space-y-2 mb-4">
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <FileText className="w-4 h-4" />
                                                <span>{questionSet.questionCount} questions</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <Award className="w-4 h-4" />
                                                <span>{questionSet.totalPoints} total points</span>
                                            </div>
                                        </div>

                                        <div className="flex gap-2 pt-4 border-t">
                                            <button
                                                onClick={() => window.open(`/question-sets/${questionSet._id}`, '_blank')}
                                                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
                                            >
                                                <Eye className="w-4 h-4" />
                                                View
                                            </button>
                                            <button
                                                onClick={() => handleToggleActive(questionSet._id)}
                                                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
                                            >
                                                {questionSet.isActive ? 'Deactivate' : 'Activate'}
                                            </button>
                                            <button
                                                onClick={() => handleDelete(questionSet._id)}
                                                className="px-3 py-2 text-sm text-red-600 border border-red-300 rounded hover:bg-red-50"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Upload Modal */}
                        {showUploadModal && (
                            <div className="fixed inset-0 bg-black/80 bg-opacity-50 flex items-center justify-center z-50">
                                <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
                                    <h2 className="text-xl font-bold text-gray-900 mb-4">Upload Question Set</h2>

                                    <form onSubmit={handleUpload}>
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Question Set Title *
                                            </label>
                                            <input
                                                type="text"
                                                value={uploadTitle}
                                                onChange={(e) => setUploadTitle(e.target.value)}
                                                placeholder="e.g., Mathematics Set 1"
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                required
                                            />
                                        </div>

                                        <div className="mb-6">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Excel/CSV File *
                                            </label>
                                            <input
                                                type="file"
                                                accept=".xlsx,.xls,.csv"
                                                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                required
                                            />
                                            <p className="text-xs text-gray-500 mt-1">
                                                Accepted formats: .xlsx, .xls, .csv
                                            </p>
                                        </div>

                                        <div className="flex gap-3">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowUploadModal(false);
                                                    setUploadTitle('');
                                                    setUploadFile(null);
                                                }}
                                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                                disabled={isUploading}
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                                                disabled={isUploading}
                                            >
                                                {isUploading ? 'Uploading...' : 'Upload'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
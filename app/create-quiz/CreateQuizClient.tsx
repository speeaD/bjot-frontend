/* eslint-disable @typescript-eslint/no-explicit-any */
// app/create-quiz/CreateQuizClient.tsx
'use client';

import { ArrowLeft, Eye } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import QuizSettingsComponent from "../componets/QuizSettings";
import QuestionsSettings from "../componets/QuestionsSettings";
import { Question, QuizSettings }  from "../types/global";

interface CreateQuizClientProps {
  user: any; // Replace with your User type
}

export default function CreateQuizClient({ user }: CreateQuizClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'details' | 'questions'>('details');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [settings, setSettings] = useState<QuizSettings>({
    coverImage: '',
    title: '',
    description: '',
    instructions: '',
    isQuizChallenge: false,
    duration: { hours: 0, minutes: 0, seconds: 0 },
    shuffleQuestions: true,
    multipleAttempts: true,
    requireLogin: true,
    permitLoseFocus: true,
    viewAnswer: true,
    viewResults: true,
    displayCalculator: false
  });

  const [questions, setQuestions] = useState<Question[]>([
    {
      type: 'multiple-choice',
      question: '',
      options: ['', '', '', ''],
      correctAnswer: '',
      points: 1,
      order: 1
    }
  ]);

  // Validation
  const validateQuizDetails = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!settings.title.trim()) {
      newErrors.title = 'Quiz title is required';
    }

    if (settings.title.length > 200) {
      newErrors.title = 'Quiz title must be less than 200 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateQuestions = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (questions.length === 0) {
      newErrors.questions = 'At least one question is required';
    }

    questions.forEach((q, index) => {
      if (!q.question.trim()) {
        newErrors[`question-${index}`] = `Question ${index + 1} text is required`;
      }

      if (q.type === 'multiple-choice') {
        const validOptions = q.options.filter(opt => opt.trim() !== '');
        if (validOptions.length < 2) {
          newErrors[`question-${index}-options`] = `Question ${index + 1} must have at least 2 options`;
        }
        if (!q.correctAnswer || !q.correctAnswer.trim()) {
          newErrors[`question-${index}-answer`] = `Question ${index + 1} must have a correct answer selected`;
        }
      }

      if (q.points <= 0) {
        newErrors[`question-${index}-points`] = `Question ${index + 1} must have points greater than 0`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateQuizDetails()) {
      setActiveTab('questions');
    } else {
      alert('Please fill in all required quiz details');
    }
  };

  const handleSubmit = async () => {
    if (!validateQuestions()) {
      alert('Please fix all question errors before submitting');
      return;
    }

    if (!validateQuizDetails()) {
      alert('Please go back and fix quiz details');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const quizData = {
        settings,
        questions: questions.map((q, index) => ({
          ...q,
          order: index + 1
        }))
      };

      const response = await fetch('/api/quiz/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(quizData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create quiz');
      }

      const data = await response.json();
      
      alert('Quiz created successfully!');
      router.push('/'); // Redirect to home page or quiz list
      router.refresh();
    } catch (error) {
      console.error('Error creating quiz:', error);
      alert(error instanceof Error ? error.message : 'Failed to create quiz');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePreview = () => {
    // Store quiz data in sessionStorage for preview
    sessionStorage.setItem('quizPreview', JSON.stringify({ settings, questions }));
    window.open('/quiz/preview', '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <button 
              onClick={() => router.back()}
              className="mr-4 p-2 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-2xl font-bold text-gray-800">Create Quiz</h1>
          </div>
          <button 
            onClick={handlePreview}
            className="flex items-center px-6 py-2 border border-gray-300 rounded-lg hover:bg-blue-50"
          >
            <Eye className="w-5 h-5 mr-2 text-blue-bg" />
            <span className="font-medium text-blue-bg">Preview</span>
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-12 gap-6">
          {/* Left Sidebar */}
          <div className="col-span-2">
            <div className="space-y-2">
              <button
                onClick={() => setActiveTab('details')}
                className={`w-full px-4 py-4 text-left font-semibold rounded-lg transition-colors ${
                  activeTab === 'details'
                    ? 'bg-blue-bg text-white'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                Quiz Details
              </button>
              <button
                onClick={() => {
                  if (validateQuizDetails()) {
                    setActiveTab('questions');
                  } else {
                    alert('Please complete quiz details first');
                  }
                }}
                className={`w-full px-4 py-4 text-left font-semibold rounded-lg transition-colors ${
                  activeTab === 'questions'
                    ? 'bg-blue-bg text-white'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                Questions
              </button>
            </div>

            {/* Progress indicator */}
            <div className="mt-8 p-4 bg-white rounded-lg shadow">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Progress</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Details</span>
                  <span className={settings.title ? 'text-green-600' : 'text-gray-400'}>
                    {settings.title ? '✓' : '○'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Questions</span>
                  <span className={questions.length > 0 && questions[0].question ? 'text-green-600' : 'text-gray-400'}>
                    {questions.length > 0 && questions[0].question ? '✓' : '○'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="col-span-10">
            {activeTab === 'details' && (
              <div>
                <QuizSettingsComponent
                  settings={settings}
                  onSettingsChange={setSettings}
                />
                
                {/* Error display */}
                {errors.title && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {errors.title}
                  </div>
                )}

                <button 
                  onClick={handleNext}
                  className="px-6 py-2 my-6 bg-blue-bg text-white rounded-lg font-medium hover:bg-indigo-700"
                >
                  Next
                </button>
              </div>
            )}

            {activeTab === 'questions' && (
              <div>
                <QuestionsSettings
                  questions={questions}
                  onQuestionsChange={setQuestions}
                />

                {/* Error display */}
                {Object.keys(errors).length > 0 && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    <p className="font-semibold mb-2">Please fix the following errors:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {Object.entries(errors).map(([key, message]) => (
                        <li key={key}>{message}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex gap-4 mt-6">
                  <button
                    type="button"
                    onClick={() => setActiveTab('details')}
                    className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Creating Quiz...' : 'Create Quiz'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
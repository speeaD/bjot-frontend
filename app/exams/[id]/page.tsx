/* eslint-disable @typescript-eslint/no-explicit-any */
import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  ArrowLeft, 
  Users, 
  Clock, 
  FileText
} from "lucide-react";

// Types
interface Question {
  type: string;
  question: string;
  options?: string[];
  correctAnswer: string | string[];
  points: number;
  order: number;
  originalQuestionId: string;
}

interface QuestionSet {
  questionSetId: string;
  batchNumber?: number;
  batchId?: string;
  batchName?: string;
  title: string;
  questions: Question[];
  totalPoints: number;
  order: number;
}

interface ExamSettings {
  coverImage: string;
  title: string;
  isQuizChallenge: boolean;
  isOpenQuiz: boolean;
  description: string;
  instructions: string;
  duration: {
    hours: number;
    minutes: number;
    seconds: number;
  };
  multipleAttempts: boolean;
  looseFocus: boolean;
  viewAnswer: boolean;
  viewResults: boolean;
  displayCalculator: boolean;
}

interface Exam {
  _id: string;
  settings: ExamSettings;
  questionSets: QuestionSet[];
  questionSetCombination: string[];
  batchConfiguration?: Array<{
    questionSetId: string;
    batchNumber: number;
  }>;
  createdBy: {
    _id: string;
    email: string;
  };
  isActive: boolean;
  totalPoints: number;
  createdAt: string;
  updatedAt: string;
  participants: number;
}

// // API function to fetch exam details
// async function getExamById(id: string): Promise<Exam> {
//   // Replace with your actual API endpoint
//   const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/quiz/${id}`, {
//     cache: 'no-store',
//   });
  
//   if (!res.ok) {
//     throw new Error('Failed to fetch exam');
//   }
  
//   const data = await res.json();
//   return data.quiz;
// }

// Loading skeleton for the page
function ExamDetailSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <div className="h-10 bg-gray-200 rounded w-32 mb-6 animate-pulse" />
        
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="h-8 bg-gray-200 rounded w-2/3 mb-4 animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-full mb-2 animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
        </div>
        
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="h-6 bg-gray-200 rounded w-48 mb-4 animate-pulse" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Import client component for actions
import ExamActions from "./ExamActions";
import { getQuizById } from "@/app/lib/data";

// Stats card component
function StatsCard({ 
  label, 
  value, 
  icon: Icon 
}: { 
  label: string; 
  value: string | number; 
  icon: any 
}) {
  return (
    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
          <Icon className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-lg font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

// Question set card component
function QuestionSetCard({ 
  questionSet, 
  index 
}: { 
  questionSet: QuestionSet; 
  index: number 
}) {
  return (
    <div className="border border-gray-200 rounded-xl p-5 hover:border-blue-300 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
              Set {index + 1}
            </span>
            {questionSet.batchName && (
              <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded">
                Batch {questionSet.batchNumber}
              </span>
            )}
          </div>
          <h4 className="text-lg font-bold text-gray-900 mb-1">
            {questionSet.title}
          </h4>
          {questionSet.batchName && (
            <p className="text-sm text-gray-500">{questionSet.batchName}</p>
          )}
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Total Points</p>
          <p className="text-xl font-bold text-blue-600">{questionSet.totalPoints}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-500 mb-1">Questions</p>
          <p className="text-lg font-semibold text-gray-900">
            {questionSet.questions.length}
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-500 mb-1">Avg Points/Q</p>
          <p className="text-lg font-semibold text-gray-900">
            {(questionSet.totalPoints / questionSet.questions.length).toFixed(1)}
          </p>
        </div>
      </div>
      
      <details className="group">
        <summary className="cursor-pointer text-sm text-blue-600 font-medium hover:text-blue-700 flex items-center gap-2">
          <span>View Questions ({questionSet.questions.length})</span>
          <span className="transition-transform group-open:rotate-180">▼</span>
        </summary>
        <div className="mt-3 space-y-2 max-h-96 overflow-y-auto">
          {questionSet.questions
            .sort((a, b) => a.order - b.order)
            .map((question, qIndex) => (
              <div 
                key={question.originalQuestionId} 
                className="bg-white border border-gray-200 rounded-lg p-3"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <p className="text-sm font-medium text-gray-900 flex-1">
                    {qIndex + 1}. {question.question}
                  </p>
                  <span className="text-xs font-semibold text-blue-600 whitespace-nowrap">
                    {question.points} pts
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                    {question.type}
                  </span>
                  {question.options && (
                    <span className="text-xs text-gray-500">
                      {question.options.length} options
                    </span>
                  )}
                </div>
              </div>
            ))}
        </div>
      </details>
    </div>
  );
}

// Main exam content component
async function ExamContent({ id }: { id: string }) {
  const exam: Exam = await getQuizById(id);
  
  const totalDuration = 
    exam.settings.duration.hours * 60 + 
    exam.settings.duration.minutes + 
    exam.settings.duration.seconds / 60;
  
  const totalQuestions = exam.questionSets.reduce(
    (sum, qs) => sum + qs.questions.length, 
    0
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
      {/* Back button */}
      <Link 
        href="/" 
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Exams
      </Link>

      {/* Exam Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <h1 className="text-3xl font-bold text-gray-900">
                {exam.settings.title}
              </h1>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  exam.isActive
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {exam.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            
            {exam.settings.description && (
              <p className="text-gray-600 mb-4">{exam.settings.description}</p>
            )}
            
            <div className="flex flex-wrap gap-2 text-sm text-gray-500">
              <span>Created: {new Date(exam.createdAt).toLocaleDateString()}</span>
              <span>•</span>
              <span>Updated: {new Date(exam.updatedAt).toLocaleDateString()}</span>
              <span>•</span>
              <span>By: {exam.createdBy.email}</span>
            </div>
          </div>
          
          {exam.settings.coverImage && (
            <div className="w-full md:w-48 h-32 relative rounded-lg overflow-hidden">
              <Image
                src={exam.settings.coverImage}
                alt={exam.settings.title}
                fill
                className="object-cover"
              />
            </div>
          )}
        </div>

        {/* Action buttons */}
        <ExamActions exam={exam} />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard 
          label="Total Questions" 
          value={totalQuestions} 
          icon={FileText} 
        />
        <StatsCard 
          label="Total Points" 
          value={exam.totalPoints} 
          icon={FileText} 
        />
        <StatsCard 
          label="Duration" 
          value={`${Math.floor(totalDuration)} min`} 
          icon={Clock} 
        />
        <StatsCard 
          label="Participants" 
          value={exam.participants || 0} 
          icon={Users} 
        />
      </div>

      {/* Settings Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Exam Settings</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-700">Quiz Challenge</span>
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              exam.settings.isQuizChallenge ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
            }`}>
              {exam.settings.isQuizChallenge ? 'Yes' : 'No'}
            </span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-700">Open Quiz</span>
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              exam.settings.isOpenQuiz ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
            }`}>
              {exam.settings.isOpenQuiz ? 'Yes' : 'No'}
            </span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-700">Multiple Attempts</span>
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              exam.settings.multipleAttempts ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
            }`}>
              {exam.settings.multipleAttempts ? 'Allowed' : 'Not Allowed'}
            </span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-700">Lose Focus</span>
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              exam.settings.looseFocus ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
            }`}>
              {exam.settings.looseFocus ? 'Allowed' : 'Not Allowed'}
            </span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-700">View Answers</span>
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              exam.settings.viewAnswer ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
            }`}>
              {exam.settings.viewAnswer ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-700">View Results</span>
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              exam.settings.viewResults ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
            }`}>
              {exam.settings.viewResults ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-700">Calculator</span>
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              exam.settings.displayCalculator ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
            }`}>
              {exam.settings.displayCalculator ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-700">Duration</span>
            <span className="text-sm font-medium text-gray-900">
              {exam.settings.duration.hours}h {exam.settings.duration.minutes}m {exam.settings.duration.seconds}s
            </span>
          </div>
        </div>

        {exam.settings.instructions && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-lg">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">Instructions</h3>
            <p className="text-sm text-blue-800 whitespace-pre-wrap">
              {exam.settings.instructions}
            </p>
          </div>
        )}
      </div>

      {/* Question Sets */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Question Sets ({exam.questionSets.length})
        </h2>
        
        <div className="space-y-4">
          {exam.questionSets
            .sort((a, b) => a.order - b.order)
            .map((questionSet, index) => (
              <QuestionSetCard 
                key={questionSet.questionSetId} 
                questionSet={questionSet} 
                index={index} 
              />
            ))}
        </div>
      </div>
    </div>
  );
}

// Main page component with params
export default async function ExamDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;
  return (
    <div className="min-h-screen bg-gray-50">
    <Suspense fallback={<ExamDetailSkeleton />}>
      <ExamContent id={id} />
    </Suspense>
    </div>
  );
}
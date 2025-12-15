import Image from 'next/image';
import { QuizSettings, QuizAuthor, QuizDuration } from '../types/global';

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function QuizCard({
    settings, questions, createdBy, isActive, totalPoints, onPlay, onEdit, onDelete
}: { _id: string; settings: QuizSettings; questions: any[]; createdBy: QuizAuthor; isActive: boolean; totalPoints: number; createdAt: string | Date; updatedAt: string | Date; participants?: number; onPlay?: (quizId: string) => void; onEdit?: (quizId: string) => void; onDelete?: (quizId: string) => void; }) {
     const formatDuration = (duration: QuizDuration): string => {
    const parts = [];
    if (duration.hours > 0) parts.push(`${duration.hours}h`);
    if (duration.minutes > 0) parts.push(`${duration.minutes}m`);
    if (duration.seconds > 0) parts.push(`${duration.seconds}s`);
    return parts.length > 0 ? parts.join(' ') : '0m';
  };

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200 relative">
      {/* Status Indicator */}
      {!isActive && (
        <div className="absolute top-4 right-4 z-10">
          <span className="px-3 py-1 bg-gray-600 text-white text-xs font-medium rounded-full">
            Inactive
          </span>
        </div>
      )}

      {/* Cover Image */}
      <div className="relative h-48 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 overflow-hidden">
        {settings.coverImage ? (
          <Image 
            src={settings.coverImage} 
            alt={settings.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-20 h-20 text-white opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        )}
        
        {/* Challenge Badge */}
        {settings.isQuizChallenge && (
          <div className="absolute top-4 left-4">
            <span className="px-3 py-1 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              Challenge
            </span>
          </div>
        )}
      </div>
      
      <div className="p-6">
        {/* Title */}
        <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2">
          {settings.title}
        </h3>

        {/* Description */}
        {settings.description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {settings.description}
          </p>
        )}

        {/* Quiz Stats Grid */}
        <div className="grid grid-cols-4 gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 text-sm">
            <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-gray-700 font-medium">{questions.length}</span>
            <span className="text-gray-500">questions</span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-gray-700 font-medium">{formatDuration(settings.duration)}</span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-gray-700 font-medium">{totalPoints}</span>
            <span className="text-gray-500">points</span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="text-gray-700 font-medium">0 </span>
            <span className="text-gray-500">Played</span>
          </div>
        </div>

        {/* Features */}
        <div className="flex flex-wrap gap-2 mb-4">
          {settings.multipleAttempts && (
            <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
              Multiple attempts
            </span>
          )}
          {settings.viewAnswer && (
            <span className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full">
              View answers
            </span>
          )}
          {settings.displayCalculator && (
            <span className="px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded-full">
              Calculator
            </span>
          )}
        </div>

        {/* Author Info */}
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
            
             
        
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-700 truncate">{createdBy.email}</p>
            <p className="text-xs text-gray-500">Quiz Creator</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {onPlay && isActive && (
            <button
            //   onClick={() => onPlay(_id)}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white font-medium py-2.5 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
              Take Quiz
            </button>
          )}
          {onEdit && (
            <button
            //   onClick={() => onEdit(_id)}
              className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors duration-200"
              title="Edit Quiz"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          )}
          {onDelete && (
            <button
            //   onClick={() => onDelete(_id)}
              className="p-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors duration-200"
              title="Delete Quiz"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
'use client';
import { QuizSettings } from '../types/global';

// Array of background colors for quiz cards
const cardColors = [
  'bg-gradient-to-br from-cyan-400 to-cyan-500',
  'bg-gradient-to-br from-yellow-400 to-yellow-500',
  'bg-gradient-to-br from-blue-400 to-blue-500',
  'bg-gradient-to-br from-red-400 to-red-500',
  'bg-gradient-to-br from-green-400 to-green-500',
  'bg-gradient-to-br from-purple-400 to-purple-500',
  'bg-gradient-to-br from-teal-600 to-teal-700',
  'bg-gradient-to-br from-cyan-400 to-cyan-500',
  'bg-gradient-to-br from-purple-500 to-purple-600',
];

const statusConfig = {
  completed: {
    label: 'Completed',
    className: 'bg-green-100 text-green-700'
  },
  ongoing: {
    label: 'Ongoing',
    className: 'bg-yellow-100 text-yellow-700'
  },
  pending: {
    label: 'Pending',
    className: 'bg-gray-100 text-gray-700'
  }
};

export default function QuizCard({
  _id,
  settings,
  isActive,
  onPlay,
  index = 0
}: {
  _id: string;
  settings: QuizSettings;
  isActive: boolean;
  onPlay?: (quizId: string) => void;
  index?: number;
}) {
  // const formatDuration = (duration: QuizDuration): string => {
  //   const parts = [];
  //   if (duration.hours > 0) parts.push(`${duration.hours}h`);
  //   if (duration.minutes > 0) parts.push(`${duration.minutes}m`);
  //   if (duration.seconds > 0) parts.push(`${duration.seconds}s`);
  //   return parts.length > 0 ? parts.join(' ') : '0m';
  // };

  // Get time ago format
  const getTimeAgo = (date: string | Date): string => {
    const now = new Date();
    const createdDate = new Date(date);
    const diffInMinutes = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} days ago`;
  };

  // Get color based on index
  const bgColor = cardColors[index % cardColors.length];
  
  // Determine status (you can customize this logic based on your data)
  const status = isActive ? 'ongoing' : 'completed';
  const statusStyle = statusConfig[status as keyof typeof statusConfig];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
      <div className="flex items-stretch">
        {/* Colored Left Section */}
        <div className={`${bgColor} w-1/3 min-h-[140px] flex items-center justify-center`}>
          <div className="text-center">
            <h3 className="text-white font-bold text-lg px-4">
              {settings.title}
            </h3>
          </div>
        </div>

        {/* Content Section */}
        <div className="flex-1 p-4 flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm text-gray-500 mb-2">
              Exam Status
            </p>
            <div className="flex items-center gap-4 mb-2">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusStyle.className}`}>
                {statusStyle.label}
              </span>
            </div>
          </div>

          {/* View Button */}
          <button
            onClick={() => onPlay && onPlay(_id)}
            className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            View
          </button>
        </div>
      </div>
    </div>
  );
}
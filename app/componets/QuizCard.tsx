'use client';
import { Clock, Users, FileText } from 'lucide-react';
import { QuizCardProps } from '../types/global';
import Link from 'next/link';

// Array of background colors for quiz cards
const cardColors = [
  'bg-gradient-to-br from-cyan-400 to-cyan-500',
  'bg-gradient-to-br from-yellow-400 to-yellow-500',
  'bg-gradient-to-br from-blue-400 to-blue-500',
  'bg-gradient-to-br from-red-400 to-red-500',
  'bg-gradient-to-br from-green-400 to-green-500',
  'bg-gradient-to-br from-purple-400 to-purple-500',
  'bg-gradient-to-br from-teal-600 to-teal-700',
  'bg-gradient-to-br from-pink-400 to-pink-500',
  'bg-gradient-to-br from-indigo-400 to-indigo-500',
];

const statusConfig = {
  completed: {
    label: 'Completed',
    className: 'bg-green-100 text-green-700',
    dotColor: 'bg-green-500'
  },
  ongoing: {
    label: 'Ongoing',
    className: 'bg-yellow-100 text-yellow-700',
    dotColor: 'bg-yellow-500'
  },
  pending: {
    label: 'Pending',
    className: 'bg-gray-100 text-gray-700',
    dotColor: 'bg-gray-500'
  }
};

export default function QuizCard({
  _id,
  settings,
  questions,
  isActive,
  createdAt,
  participants = 0,
  onPlay,
  index = 0
}: QuizCardProps & { index?: number }) {
  // Format duration from settings
  const formatDuration = (): string => {
    if (!settings.duration) return 'N/A';
    const { hours = 0, minutes = 0, seconds = 0 } = settings.duration;
    const parts = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0 && hours === 0) parts.push(`${seconds}s`);
    return parts.length > 0 ? parts.join(' ') : 'No limit';
  };

  console.log('QuizCard props:', {
    _id,
    settings,
    questions,
    isActive,
    createdAt,
    participants,
    index
  });

  // Get time ago format
  const getTimeAgo = (date: string | Date): string => {
    const now = new Date();
    const createdDate = new Date(date);
    const diffInMinutes = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    const diffInWeeks = Math.floor(diffInDays / 7);
    return `${diffInWeeks}w ago`;
  };

  // Get color based on index
  const bgColor = cardColors[index % cardColors.length];
  
  // Determine status
  const status = isActive ? 'ongoing' : 'completed';
  const statusStyle = statusConfig[status as keyof typeof statusConfig];

  // Get question count from questions array
  const questionCount = questions?.length || 0;

  return (
    <div className="group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg hover:border-gray-200 transition-all duration-300">
      {/* Colored Header Section */}
      <div className={`${bgColor} p-6 relative overflow-hidden`}>
        {/* Decorative pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white rounded-full -mr-10 -mt-10" />
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-white rounded-full -ml-8 -mb-8" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-white font-bold text-lg leading-tight line-clamp-2 flex-1 pr-2">
              {settings.title || 'Untitled Exam'}
            </h3>
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${statusStyle.className} bg-opacity-90 backdrop-blur-sm flex-shrink-0`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dotColor} animate-pulse`} />
              {statusStyle.label}
            </div>
          </div>
          
          {settings.description && (
            <p className="text-white/90 text-sm line-clamp-2 leading-relaxed">
              {settings.description}
            </p>
          )}
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mb-4">
         
          
          <div className="flex flex-col items-center text-center">
            <span className="text-xs text-gray-500 mb-0.5">Duration</span>
            <span className="text-sm font-bold text-gray-900">{formatDuration()}</span>
          </div>

       
          <Link href={`/exams/${_id}`}
            
            className="w-30 h-10 mr-3 items-center flex justify-center text-center bg-gray-900 text-white text-sm rounded-lg font-medium hover:bg-gray-800 transition-all duration-200 group-hover:shadow-md"
          >
            View Exam
          </Link>
    
          
          
        </div>

        {/* Divider */}
       
      </div>
    </div>
  );
}
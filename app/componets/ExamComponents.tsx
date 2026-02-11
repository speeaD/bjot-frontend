/* eslint-disable @typescript-eslint/no-explicit-any */
import { Clock, Users, FileText, CheckCircle, XCircle } from "lucide-react";

// Status Badge Component
export function StatusBadge({ 
  isActive 
}: { 
  isActive: boolean 
}) {
  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold ${
        isActive
          ? 'bg-green-100 text-green-700'
          : 'bg-gray-100 text-gray-700'
      }`}
    >
      {isActive ? 'Active' : 'Inactive'}
    </span>
  );
}

// Exam Stats Component
export function ExamStats({ 
  totalQuestions, 
  totalPoints, 
  duration, 
  participants 
}: { 
  totalQuestions: number;
  totalPoints: number;
  duration: number;
  participants: number;
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatItem 
        icon={FileText} 
        label="Questions" 
        value={totalQuestions} 
      />
      <StatItem 
        icon={FileText} 
        label="Points" 
        value={totalPoints} 
      />
      <StatItem 
        icon={Clock} 
        label="Duration" 
        value={`${Math.floor(duration)} min`} 
      />
      <StatItem 
        icon={Users} 
        label="Participants" 
        value={participants} 
      />
    </div>
  );
}

function StatItem({ 
  icon: Icon, 
  label, 
  value 
}: { 
  icon: any;
  label: string;
  value: string | number;
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

// Settings Grid Component
export function SettingsGrid({ 
  settings 
}: { 
  settings: any 
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <SettingItem 
        label="Quiz Challenge" 
        value={settings.isQuizChallenge} 
      />
      <SettingItem 
        label="Open Quiz" 
        value={settings.isOpenQuiz} 
      />
      <SettingItem 
        label="Multiple Attempts" 
        value={settings.multipleAttempts} 
      />
      <SettingItem 
        label="Allow Lose Focus" 
        value={settings.looseFocus} 
      />
      <SettingItem 
        label="View Answers" 
        value={settings.viewAnswer} 
      />
      <SettingItem 
        label="View Results" 
        value={settings.viewResults} 
      />
      <SettingItem 
        label="Display Calculator" 
        value={settings.displayCalculator} 
      />
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <span className="text-sm text-gray-700">Duration</span>
        <span className="text-sm font-medium text-gray-900">
          {settings.duration.hours}h {settings.duration.minutes}m {settings.duration.seconds}s
        </span>
      </div>
    </div>
  );
}

function SettingItem({ 
  label, 
  value 
}: { 
  label: string;
  value: boolean;
}) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <span className="text-sm text-gray-700">{label}</span>
      {value ? (
        <CheckCircle className="w-5 h-5 text-green-600" />
      ) : (
        <XCircle className="w-5 h-5 text-gray-400" />
      )}
    </div>
  );
}

// Question Type Badge
export function QuestionTypeBadge({ 
  type 
}: { 
  type: string 
}) {
  const colors: Record<string, string> = {
    'multiple-choice': 'bg-blue-100 text-blue-700',
    'true-false': 'bg-green-100 text-green-700',
    'short-answer': 'bg-purple-100 text-purple-700',
    'essay': 'bg-orange-100 text-orange-700',
  };

  return (
    <span className={`text-xs px-2 py-0.5 rounded ${colors[type] || 'bg-gray-100 text-gray-700'}`}>
      {type}
    </span>
  );
}

// Empty State Component
export function EmptyState({ 
  title, 
  description, 
  actionLabel, 
  onAction 
}: { 
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-4">
        <FileText className="w-16 h-16 text-gray-400 mx-auto" />
      </div>
      <h3 className="text-xl font-semibold text-gray-800 mb-2">{title}</h3>
      <p className="text-gray-500 mb-6 max-w-md">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-6 py-2 bg-blue-bg text-white rounded-lg font-medium hover:opacity-90"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

// Loading Spinner
export function LoadingSpinner({ 
  size = "md" 
}: { 
  size?: "sm" | "md" | "lg" 
}) {
  const sizeClasses = {
    sm: "h-4 w-4 border-2",
    md: "h-8 w-8 border-2",
    lg: "h-12 w-12 border-4",
  };

  return (
    <div className={`animate-spin rounded-full border-b-blue-600 ${sizeClasses[size]}`} />
  );
}

// Confirmation Modal
export function ConfirmationModal({ 
  isOpen, 
  title, 
  message, 
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm, 
  onCancel,
  variant = "danger"
}: { 
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: "danger" | "warning" | "info";
}) {
  if (!isOpen) return null;

  const variantColors = {
    danger: "bg-red-600 hover:bg-red-700",
    warning: "bg-yellow-600 hover:bg-yellow-700",
    info: "bg-blue-600 hover:bg-blue-700",
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 mb-6">{message}</p>
        
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-white rounded-lg font-medium transition-colors ${variantColors[variant]}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// Toast Notification
export function Toast({ 
  message, 
  type = "info",
  onClose 
}: { 
  message: string;
  type?: "success" | "error" | "warning" | "info";
  onClose: () => void;
}) {
  const typeStyles = {
    success: "bg-green-500",
    error: "bg-red-500",
    warning: "bg-yellow-500",
    info: "bg-blue-500",
  };

  return (
    <div className={`fixed bottom-4 right-4 ${typeStyles[type]} text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 z-50`}>
      <p className="font-medium">{message}</p>
      <button
        onClick={onClose}
        className="text-white hover:text-gray-200 transition-colors"
      >
        ✕
      </button>
    </div>
  );
}
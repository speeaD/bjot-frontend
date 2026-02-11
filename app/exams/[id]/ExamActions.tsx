"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Edit, 
  Trash2, 
  ToggleLeft,
  ToggleRight,
  Download,
  Share2
} from "lucide-react";

interface ExamActionsProps {
  exam: {
    _id: string;
    isActive: boolean;
    settings: {
      title: string;
      description?: string;
    };
  };
}

export default function ExamActions({ exam }: ExamActionsProps) {
  const router = useRouter();

  const handleToggleActive = async () => {
    try {
      const res = await fetch(`/api/quiz/${exam._id}/toggle-active`, {
        method: 'PATCH',
      });
      
      if (res.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error('Error toggling exam status:', error);
      alert('Failed to toggle exam status');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this exam? This action cannot be undone.')) {
      return;
    }
    
    try {
      const res = await fetch(`/api/quiz/${exam._id}`, {
        method: 'DELETE',
      });
      
      if (res.ok) {
        router.push('/');
      } else {
        const error = await res.json();
        alert(error.message || 'Failed to delete exam');
      }
    } catch (error) {
      console.error('Error deleting exam:', error);
      alert('Failed to delete exam');
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/exam/${exam._id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: exam.settings.title,
          text: exam.settings.description || exam.settings.title,
          url: shareUrl,
        });
      } catch (error) {
        // User cancelled share or error occurred
        console.log('Share cancelled or failed');
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(shareUrl);
        alert('Link copied to clipboard!');
      } catch (error) {
        console.error('Failed to copy:', error);
        alert('Failed to copy link');
      }
    }
  };

  const handleExport = async () => {
    try {
      const res = await fetch(`/api/quiz/${exam._id}`);
      const data = await res.json();
      
      // Create a blob from the JSON data
      const blob = new Blob([JSON.stringify(data.quiz, null, 2)], {
        type: 'application/json',
      });
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${exam.settings.title.replace(/[^a-z0-9]/gi, '_')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export exam');
    }
  };

  return (
    <div className="flex flex-wrap gap-3">
      <Link
        href={`/exams/${exam._id}/edit`}
        className="px-4 py-2 bg-blue-bg text-white rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
      >
        <Edit className="w-4 h-4" />
        Edit Exam
      </Link>
      
      <button
        onClick={handleToggleActive}
        className={`px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center gap-2 ${
          exam.isActive
            ? 'bg-yellow-500 text-white'
            : 'bg-green-500 text-white'
        }`}
      >
        {exam.isActive ? (
          <>
            <ToggleLeft className="w-4 h-4" />
            Deactivate
          </>
        ) : (
          <>
            <ToggleRight className="w-4 h-4" />
            Activate
          </>
        )}
      </button>
      
      <button
        onClick={handleShare}
        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center gap-2"
      >
        <Share2 className="w-4 h-4" />
        Share
      </button>
      
      <button
        onClick={handleExport}
        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center gap-2"
      >
        <Download className="w-4 h-4" />
        Export
      </button>
      
      <button
        onClick={handleDelete}
        className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
      >
        <Trash2 className="w-4 h-4" />
        Delete
      </button>
    </div>
  );
}
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { adminApi } from '../lib/api/attendance-client';
import { AttendanceSession, Department } from '../types/global';
import {
  formatTime,
  formatDate,
  formatDateForApi,
  getTodayDate,
  getTimeRemaining,
  getDepartmentColor,
} from '../lib/utils/attendance-utils';
import Sidebar from './Sidebar';
import { Upload } from 'lucide-react';

interface DailyDashboardClientProps {
  initialSessions: Record<Department, AttendanceSession[]> | null;
  initialDate: string;
  initialError: string | null;
}

export default function DailyDashboardClient({
  initialSessions,
  initialDate,
  initialError: serverError
}: DailyDashboardClientProps) {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [sessions, setSessions] = useState<Record<Department, AttendanceSession[]>>(
    initialSessions || {
      Sciences: [],
      Arts: [],
      Commercial: [],
    }
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(serverError || '');
  const [successMessage, setSuccessMessage] = useState('');
  const [expandedDepartment, setExpandedDepartment] = useState<Department | null>('Sciences');

  const loadSessions = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await adminApi.getSessionsForDate(selectedDate);
      console.log("Fetched sessions for date", selectedDate, ":", response);
      setSessions(response.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load sessions');
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    if (selectedDate !== initialDate) {
      loadSessions();
      // Update URL
      router.push(`/attendance?date=${selectedDate}`);
    }
  }, [selectedDate, loadSessions, router, initialDate]);

  // Poll for updates every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadSessions();
    }, 300000);

    return () => clearInterval(interval);
  }, [selectedDate, loadSessions]);



  const handleCreateSessions = async (department: Department) => {
    try {
      await adminApi.createSessionsFromSchedule(department, selectedDate);
      setSuccessMessage(`Sessions created for ${department}`);
      loadSessions();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to create sessions');
    }
  };

  const handleOpenWindow = async (sessionId: string) => {
    try {
      await adminApi.openAttendanceWindow(sessionId, {
        durationMinutes: 30,
        bufferMinutes: 15,
      });
      setSuccessMessage('Attendance window opened');
      loadSessions();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to open window');
    }
  };

  const handleCloseWindow = async (sessionId: string) => {
    try {
      await adminApi.closeAttendanceWindow(sessionId);
      setSuccessMessage('Attendance window closed');
      loadSessions();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to close window');
    }
  };

  const SessionCard = ({ session }: { session: AttendanceSession }) => {
    console.log('Rendering session card for session:', session);
    const isWindowOpen = session.attendanceWindow.isOpen;
    const timeRemaining = isWindowOpen && session.attendanceWindow.openedAt
      ? getTimeRemaining(session.attendanceWindow.openedAt, session.attendanceWindow.durationMinutes)
      : null;

    const attendancePercentage = session.totalStudents > 0
      ? ((session.presentCount / session.totalStudents) * 100).toFixed(0)
      : 0;

    return (
      <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 text-lg">{session.questionSetTitle}</h4>
            <p className="text-sm text-gray-600 mt-1">
              {formatTime(session.scheduledStartTime)} - {formatTime(session.scheduledEndTime)}
            </p>
          </div>

          <div className={`px-3 py-1 rounded-full text-xs font-medium ${session.status === 'ongoing' ? 'bg-green-100 text-green-800' :
            session.status === 'completed' ? 'bg-gray-100 text-gray-800' :
              session.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                'bg-blue-100 text-blue-800'
            }`}>
            {session.status}
          </div>
        </div>

        {/* Attendance Window Status */}
        <div className="mb-4">
          {isWindowOpen ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-green-800">Window Open</span>
                </div>
                {timeRemaining && !timeRemaining.isExpired && (
                  <span className="text-sm text-green-700 font-mono">
                    {timeRemaining.displayText} left
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
                <span className="text-sm font-medium text-gray-600">Window Closed</span>
              </div>
            </div>
          )}
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-blue-900">{session.totalStudents}</div>
            <div className="text-xs text-blue-700">Total</div>
          </div>
          <div className="bg-green-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-green-900">{session.presentCount}</div>
            <div className="text-xs text-green-700">Present</div>
          </div>
          <div className="bg-red-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-red-900">{session.absentCount}</div>
            <div className="text-xs text-red-700">Absent</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Attendance</span>
            <span>{attendancePercentage}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all duration-300"
              style={{ width: `${attendancePercentage}%` }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-2">
          {isWindowOpen ? (
            <button
              onClick={() => handleCloseWindow(session._id)}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
            >
              Close Window
            </button>
          ) : (
            <button
              onClick={() => handleOpenWindow(session._id)}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
            >
              Open Window
            </button>
          )}
          <button
            onClick={() => window.location.href = `/admin/attendance/sessions/${session._id}`}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            View Details
          </button>
        </div>
      </div>
    );
  };

  const DepartmentSection = ({ department }: { department: Department }) => {
    const departmentSessions = sessions[department] || [];
    const isExpanded = expandedDepartment === department;

    const totalStudents = departmentSessions.reduce((sum, s) => sum + s.totalStudents, 0);
    const totalPresent = departmentSessions.reduce((sum, s) => sum + s.presentCount, 0);
    const avgAttendance = totalStudents > 0 ? ((totalPresent / totalStudents) * 100).toFixed(0) : 0;

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <button
          onClick={() => setExpandedDepartment(isExpanded ? null : department)}
          className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center space-x-4">
            <div className={`px-4 py-2 rounded-lg font-semibold ${getDepartmentColor(department)}`}>
              {department}
            </div>
            <div className="text-left">
              <div className="text-sm text-gray-600">
                {departmentSessions.length} {departmentSessions.length === 1 ? 'class' : 'classes'} today
              </div>
              {departmentSessions.length > 0 && (
                <div className="text-xs text-gray-500">
                  {totalPresent}/{totalStudents} students ({avgAttendance}% avg)
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {departmentSessions.length === 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCreateSessions(department);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                Create Sessions
              </button>
            )}
            <svg
              className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>

        {isExpanded && departmentSessions.length > 0 && (
          <div className="p-6 pt-0 border-t border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {departmentSessions.map((session) => (
                <SessionCard key={session._id} session={session} />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="mx-auto p-6 bg-gray-50 min-h-screen">

      <div className='max-w-7xl mx-auto'>
        <div className="grid grid-cols-12 gap-6">
          {/* Left Sidebar */}
          <Sidebar />

          {/* Main Content */}
          <div className="col-span-9">
            <div className="flex items-center justify-between mb-8">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">Attendance</h1>
                                <p className="text-gray-600 mt-1">Manage attendance for your classes</p>
                            </div>
                            <div className="flex gap-3">
                               
                                <button
                                    onClick={() => router.push('/schedules')}
                                    className="flex items-center gap-2 px-6 py-2 bg-green-700 text-white rounded-lg hover:bg-green-700"
                                >
                               
                                    Create Schedules
                                </button>
                            </div>
                        </div>

            {/* Date Selector */}
            <div className="mb-6 flex items-center space-x-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex-1 flex items-center justify-between">
                <p className="text-sm text-gray-600 mt-6">
                  {formatDate(selectedDate)}
                </p>
                <button
                  onClick={loadSessions}
                  disabled={isLoading}
                  className="mt-6 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>
            </div>

            {/* Messages */}
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-600">
                {successMessage}
              </div>
            )}

            {/* Department Sections */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="space-y-4">
                <DepartmentSection department="Sciences" />
                <DepartmentSection department="Arts" />
                <DepartmentSection department="Commercial" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
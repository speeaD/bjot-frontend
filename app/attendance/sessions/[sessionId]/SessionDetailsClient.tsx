/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { adminApi } from '../../../lib/api/attendance-client';
import { SessionAttendanceData, AttendanceRecord, Student } from '../../../types/global';
import {
  formatTime,
  formatDate,
  formatShortDate,
  getStatusColor,
  getDepartmentColor,
} from '../../..//lib/utils/attendance-utils';

interface SessionDetailsClientProps {
  sessionId: string;
  initialData: SessionAttendanceData | null;
  initialError: string | null;
}

export default function SessionDetailsClient({ 
  sessionId,
  initialData, 
  initialError: serverError 
}: SessionDetailsClientProps) {
  const router = useRouter();
  const [data, setData] = useState<SessionAttendanceData | null>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(serverError || '');
  const [successMessage, setSuccessMessage] = useState('');
  const [filter, setFilter] = useState<'all' | 'present' | 'absent'>('all');

  const loadSessionData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await adminApi.getSessionAttendance(sessionId);
      console.log('Fetched session attendance data:', response);
      setData(response || null);
    } catch (err: any) {
      setError(err.message || 'Failed to load session data');
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadSessionData();
    }, 300000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [sessionId, loadSessionData]);

  

  const handleMarkAttendance = async (studentId: string, status: 'present' | 'absent' | 'excused') => {
    try {
      await adminApi.manuallyMarkAttendance(sessionId, studentId, status);
      setSuccessMessage(`Student marked as ${status}`);
      loadSessionData();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to mark attendance');
    }
  };

  if (!data && !isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center py-12">
          <p className="text-gray-600">{error || 'Session not found'}</p>
          <button
            onClick={() => router.push('/admin/attendance/dashboard')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const { session, presentRecords, absentStudents, statistics } = data || {};

  // Filter records
  const filteredRecords = filter === 'all' 
    ? presentRecords || []
    : filter === 'present' 
    ? (presentRecords || []).filter(r => r.status === 'present')
    : [];

  const displayedAbsent = filter === 'all' || filter === 'absent' ? absentStudents || [] : [];

  return (
    <div className='bg-gray-50 min-h-screen'>
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="mb-4 text-blue-600 hover:text-blue-700 flex items-center"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        
        {session && (
          <>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{session.questionSetTitle}</h1>
            <div className="flex items-center space-x-4 text-gray-600">
              <span className={`px-3 py-1 rounded-lg text-sm font-medium ${getDepartmentColor(session.department)}`}>
                {session.department}
              </span>
              <span>{formatDate(session.date)}</span>
              <span>{formatTime(session.scheduledStartTime)} - {formatTime(session.scheduledEndTime)}</span>
            </div>
          </>
        )}
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

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-sm text-gray-600 mb-1">Total Students</div>
            <div className="text-3xl font-bold text-gray-900">{statistics.total}</div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-sm text-gray-600 mb-1">Present</div>
            <div className="text-3xl font-bold text-green-600">{statistics.present}</div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-sm text-gray-600 mb-1">Absent</div>
            <div className="text-3xl font-bold text-red-600">{statistics.absent}</div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-sm text-gray-600 mb-1">Attendance Rate</div>
            <div className="text-3xl font-bold text-blue-600">{statistics.percentage}%</div>
            <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${statistics.percentage}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex space-x-8">
          <button
            onClick={() => setFilter('all')}
            className={`pb-4 px-2 font-medium transition-colors ${
              filter === 'all'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            All Students ({(presentRecords?.length || 0) + (absentStudents?.length || 0)})
          </button>
          <button
            onClick={() => setFilter('present')}
            className={`pb-4 px-2 font-medium transition-colors ${
              filter === 'present'
                ? 'border-b-2 border-green-600 text-green-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Present ({presentRecords?.length || 0})
          </button>
          <button
            onClick={() => setFilter('absent')}
            className={`pb-4 px-2 font-medium transition-colors ${
              filter === 'absent'
                ? 'border-b-2 border-red-600 text-red-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Absent ({absentStudents?.length || 0})
          </button>
        </div>
      </div>

      {/* Attendance List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Marked At
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {/* Present Students */}
                {filteredRecords.map((record) => (
                  <tr key={record._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{record.studentName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">{record.studentEmail}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                          {record.status}
                        </span>
                        {record.isLate && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            Late ({record.minutesLate}m)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(record.markedAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <select
                        value={record.status}
                        onChange={(e) => handleMarkAttendance(record.student, e.target.value as any)}
                        className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="present">Present</option>
                        <option value="absent">Absent</option>
                        <option value="excused">Excused</option>
                      </select>
                    </td>
                  </tr>
                ))}

                {/* Absent Students */}
                {displayedAbsent.map((student: Student) => (
                  <tr key={student._id} className="hover:bg-gray-50 bg-red-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{student.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">{student.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Absent
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      Not marked
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleMarkAttendance(student._id, 'present')}
                        className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs"
                      >
                        Mark Present
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredRecords.length === 0 && displayedAbsent.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No students found
            </div>
          )}
        </div>
      )}

      {/* Refresh Button */}
      <div className="mt-6 text-center">
        <button
          onClick={loadSessionData}
          disabled={isLoading}
          className="px-6 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>
      </div>
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Department } from '../../types/global';
import { formatShortDate, getDepartmentColor } from '../../lib/utils/attendance-utils';
import { set } from 'zod';

interface StudentAnalytics {
  studentId: string;
  name: string;
  email: string;
  accountType: string;
  totalClasses: number;
  present: number;
  absent: number;
  excused: number;
  late: number;
  attendanceRate: number;
}

interface DepartmentStats {
  totalStudents: number;
  averageAttendanceRate: string;
  atRiskStudents: number;
  perfectAttendance: number;
}

interface AnalyticsData {
  department: Department;
  statistics: DepartmentStats;
  students: StudentAnalytics[];
  dateRange: {
    startDate: string | null;
    endDate: string | null;
  };
}

interface StudentAnalyticsClientProps {
  initialData: AnalyticsData | null;
  initialDepartment?: string;
  initialStartDate?: string;
  initialEndDate?: string;
  initialError: string | null;
}

export default function StudentAnalyticsClient({ 
  initialData,
  initialDepartment,
  initialStartDate,
  initialEndDate,
  initialError: serverError 
}: StudentAnalyticsClientProps) {
  const router = useRouter();
  const [data, setData] = useState<AnalyticsData | null>(initialData);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | ''>(
    (initialDepartment as Department) || ''
  );
  const [startDate, setStartDate] = useState(initialStartDate || '');
  const [endDate, setEndDate] = useState(initialEndDate || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(serverError || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'at-risk' | 'excellent'>('all');

  const handleDepartmentChange = async (dept: Department) => {
    setData(null);
    setIsLoading(true);
    setSelectedDepartment(dept);
    const params = new URLSearchParams();
    params.set('department', dept);
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    try{
        const response = await fetch(`/api/attendance/analytics/department/${dept}`, {
          headers: {        
            'Content-Type': 'application/json',
          },
          cache: 'no-store',
        });
        if (!response.ok) {          throw new Error('Failed to fetch department analytics');
        }
        const result = await response.json();
        setData(result.data.data);
        setIsLoading(false);
        setError('');
    }
    catch(err) {
        console.error('Error fetching department analytics:', err);
        setIsLoading(false);
        setError('Failed to load analytics data. Please try again.');
    }
    router.push(`/attendance/analytics?${params.toString()}`);
  };

  const handleDateFilter = () => {
    if (!selectedDepartment) return;
    
    const params = new URLSearchParams();
    params.set('department', selectedDepartment);
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    router.push(`/attendance/analytics?${params.toString()}`);
  };

  const handleResetFilters = () => {
    setStartDate('');
    setEndDate('');
    if (selectedDepartment) {
      router.push(`/attendance/analytics?department=${selectedDepartment}`);
    }
  };

  const handleViewStudent = (studentId: string) => {
    router.push(`/attendance/analytics/student/${studentId}`);
  };

  // Filter students based on search and status
  const filteredStudents = data?.students.filter(student => {
    // Search filter
    const matchesSearch = !searchQuery || 
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Status filter
    const matchesStatus = 
      filterStatus === 'all' ||
      (filterStatus === 'at-risk' && student.attendanceRate < 79) ||
      (filterStatus === 'excellent' && student.attendanceRate >= 80);
    
    return matchesSearch && matchesStatus;
  }) || [];

  const getAttendanceColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600';
    if (rate >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getAttendanceBadge = (rate: number) => {
    if (rate >= 90) return 'bg-green-100 text-green-800';
    if (rate >= 75) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Student Attendance Analytics</h1>
        <p className="text-gray-600">Track and analyze student attendance patterns</p>
      </div>

      {/* Department Selection */}
      {!selectedDepartment && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Department</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['Sciences', 'Arts', 'Commercial'].map((dept) => (
              <button
                key={dept}
                onClick={() => handleDepartmentChange(dept as Department)}
                className={`p-6 rounded-lg border-2 hover:border-blue-500 transition-all ${getDepartmentColor(dept)}`}
              >
                <h3 className="text-xl font-bold">{dept}</h3>
                <p className="text-sm mt-2">View analytics</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Analytics Dashboard */}
      {selectedDepartment && (
        <>
          {/* Department Header & Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <span className={`px-4 py-2 rounded-lg font-semibold text-lg ${getDepartmentColor(selectedDepartment)}`}>
                  {selectedDepartment}
                </span>
                <button
                  onClick={() => {
                    setSelectedDepartment('');
                    router.push('/attendance/analytics');
                  }}
                  className="text-blue-600 hover:text-blue-700 text-sm"
                >
                  Change Department
                </button>
              </div>
            </div>

            {/* Date Range Filter */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-end space-x-2">
                <button
                  onClick={handleDateFilter}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Apply Filter
                </button>
                {(startDate || endDate) && (
                  <button
                    onClick={handleResetFilters}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
              {error}
            </div>
          )}

          {/* Statistics Cards */}
          {data && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Students</p>
                    <p className="text-3xl font-bold text-gray-900">{data.statistics.totalStudents}</p>
                  </div>
                  <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Average Rate</p>
                    <p className="text-3xl font-bold text-green-600">{data.statistics.averageAttendanceRate}%</p>
                  </div>
                  <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">At Risk</p>
                    <p className="text-3xl font-bold text-red-600">{data.statistics.atRiskStudents}</p>
                  </div>
                  <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Perfect Attendance</p>
                    <p className="text-3xl font-bold text-purple-600">{data.statistics.perfectAttendance}</p>
                  </div>
                  <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filters and Search */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              <div className="flex space-x-2">
                <button
                  onClick={() => setFilterStatus('all')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    filterStatus === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All Students
                </button>
                <button
                  onClick={() => setFilterStatus('at-risk')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    filterStatus === 'at-risk'
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  At Risk (&lt;79%)
                </button>
                <button
                  onClick={() => setFilterStatus('excellent')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    filterStatus === 'excellent'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Excellent (≥80%)
                </button>
              </div>

              <div className="flex-1 md:ml-4 max-w-md">
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Students Table */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Students Found</h3>
              <p className="text-gray-600">Try adjusting your search or filters</p>
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
                        Account Type
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Classes
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Present
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Absent
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Late
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rate
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredStudents.map((student) => (
                      <tr key={student.studentId} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{student.name}</div>
                            <div className="text-sm text-gray-500">{student.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            student.accountType === 'premium'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {student.accountType}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-sm font-medium text-gray-900">{student.totalClasses}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-sm font-medium text-green-600">{student.present}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-sm font-medium text-red-600">{student.absent}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-sm font-medium text-orange-600">{student.late}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex flex-col items-center">
                            <span className={`text-lg font-bold ${getAttendanceColor(student.attendanceRate)}`}>
                              {student.attendanceRate.toFixed(1)}%
                            </span>
                            <span className={`mt-1 inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${getAttendanceBadge(student.attendanceRate)}`}>
                              {student.attendanceRate >= 90 ? 'Excellent' : 
                               student.attendanceRate >= 75 ? 'Good' : 'At Risk'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleViewStudent(student.studentId)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Results Count */}
              <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-600">
                Showing {filteredStudents.length} of {data?.students.length || 0} students
              </div>
            </div>
          )}
        </>
      )}
    </div>
    </div>
  );
}
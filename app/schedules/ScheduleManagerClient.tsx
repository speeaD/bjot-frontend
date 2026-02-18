/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../lib/api/attendance-client';
import { Schedule, Department, ClassSession } from '../types/global';
import { getDayName, formatTime } from '../lib/utils/attendance-utils';

const DEPARTMENTS: Department[] = ['Sciences', 'Arts', 'Commercial'];
const DAYS: { value: DayOfWeek; label: string }[] = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export default function ScheduleManagerClient({ 
  initialSchedules,
  initialError 
}: {
  initialSchedules: Schedule[];
  initialError?: string | null;
}) {
  const [selectedDepartment, setSelectedDepartment] = useState<Department>('Sciences');
  const [allSchedules, setAllSchedules] = useState<Schedule[]>(initialSchedules);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(initialError || '');
  const [successMessage, setSuccessMessage] = useState('');
  const [questionSets, setQuestionSets] = useState<any[]>([]);

  // Form state for adding new class
  const [showAddForm, setShowAddForm] = useState(false);
  const [newClass, setNewClass] = useState({
    dayOfWeek: 1 as DayOfWeek,
    questionSet: '',
    startTime: '19:00',
    endTime: '21:00',
  });

  // Derive schedule from allSchedules - SINGLE SOURCE OF TRUTH
  const schedule = allSchedules.find(s => s.department === selectedDepartment) || null;

  const loadSchedule = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await adminApi.getDepartmentSchedule(selectedDepartment);

      console.log('Fetched schedule for', selectedDepartment, ':', response);
      const newSchedule = response.data || null;
      
      if (newSchedule) {
        // Update allSchedules with the new schedule
        setAllSchedules(prev => {
          const filtered = prev.filter(s => s.department !== selectedDepartment);
          return [...filtered, newSchedule];
        });
      } else {
        // Remove from allSchedules if no schedule exists
        setAllSchedules(prev => prev.filter(s => s.department !== selectedDepartment));
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load schedule');
    } finally {
      setIsLoading(false);
    }
  }, [selectedDepartment]);

  // Load schedule when department changes
  useEffect(() => {
    loadSchedule();
  }, [selectedDepartment, loadSchedule]);

  useEffect(() => {
    loadQuestionSets();
  }, []);

  const loadQuestionSets = async () => {
    try {
      const response = await fetch('/api/questionset');
      if (!response.ok) {
        throw new Error('Failed to fetch question sets');
      }
      const data = await response.json();
      setQuestionSets(data.questionSets || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load question sets');
    }
  };

  const handleAddClass = () => {
    if (!newClass.questionSet) {
      setError('Please select a subject');
      return;
    }

    const newClassSession: ClassSession = {
      _id: `temp-${Date.now()}`,
      dayOfWeek: newClass.dayOfWeek,
      dayName: getDayName(newClass.dayOfWeek),
      questionSet: newClass.questionSet,
      questionSetTitle: questionSets.find(qs => qs._id === newClass.questionSet)?.title || '',
      startTime: newClass.startTime,
      endTime: newClass.endTime,
      isActive: true,
    };

    // Update allSchedules - handle both existing and new schedules
    setAllSchedules(prev => {
      const filtered = prev.filter(s => s.department !== selectedDepartment);
      
      if (schedule) {
        // Department has existing schedule - add to it
        return [
          ...filtered,
          {
            ...schedule,
            weeklySchedule: [...schedule.weeklySchedule, newClassSession],
          }
        ];
      } else {
        // Department has no schedule - create new one
        return [
          ...filtered,
          {
            _id: `temp-schedule-${Date.now()}`,
            department: selectedDepartment,
            weeklySchedule: [newClassSession],
            overrides: [],
            createdBy: '', // Will be set by backend
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        ];
      }
    });

    setShowAddForm(false);
    setNewClass({
      dayOfWeek: 1,
      questionSet: '',
      startTime: '19:00',
      endTime: '21:00',
    });
    setError(''); // Clear any errors
  };

  const handleRemoveClass = (index: number) => {
    const updatedSchedule = schedule?.weeklySchedule.filter((_, i) => i !== index) || [];
    
    // Update allSchedules instead of schedule
    setAllSchedules(prev => {
      const filtered = prev.filter(s => s.department !== selectedDepartment);
      return [
        ...filtered,
        {
          ...schedule!,
          weeklySchedule: updatedSchedule,
        }
      ];
    });
  };

  const handleSaveSchedule = async () => {
    if (!schedule || schedule.weeklySchedule.length === 0) {
      setError('Please add at least one class before saving');
      return;
    }

    setIsSaving(true);
    setError('');
    setSuccessMessage('');

    try {
      await adminApi.createOrUpdateSchedule({
        department: selectedDepartment,
        weeklySchedule: schedule.weeklySchedule.map(cls => ({
          dayOfWeek: cls.dayOfWeek,
          dayName: cls.dayName,
          questionSet: typeof cls.questionSet === 'string' ? cls.questionSet : cls.questionSet._id,
          startTime: cls.startTime,
          endTime: cls.endTime,
          isActive: cls.isActive,
        })),
      });

      setSuccessMessage('Schedule saved successfully!');
      await loadSchedule(); // Reload to get fresh data from server
      setTimeout(() => setSuccessMessage(''), 3000); // Clear message after 3 seconds
    } catch (err: any) {
      setError(err.message || 'Failed to save schedule');
    } finally {
      setIsSaving(false);
    }
  };

  // Group schedule by day
  const groupedSchedule: Record<DayOfWeek, ClassSession[]> = {
    0: [],
    1: [],
    2: [],
    3: [],
    4: [],
    5: [],
    6: [],
  };

  if (schedule) {
    schedule.weeklySchedule.forEach((cls) => {
      groupedSchedule[cls.dayOfWeek].push(cls);
    });
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Schedule Manager</h1>
          <p className="text-gray-600">Manage weekly class schedules for each department</p>
        </div>

        {/* Department Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <div className="flex space-x-8">
            {DEPARTMENTS.map((dept) => (
              <button
                key={dept}
                onClick={() => setSelectedDepartment(dept)}
                className={`pb-4 px-2 font-medium transition-colors ${
                  selectedDepartment === dept
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {dept}
              </button>
            ))}
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

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {/* Weekly Schedule Grid */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Weekly Schedule</h2>
                  <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {showAddForm ? 'Cancel' : '+ Add Class'}
                  </button>
                </div>

                {/* Show message if no schedule exists */}
                {!schedule && !showAddForm && (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-gray-600 mb-4">
                      No schedule found for {selectedDepartment} department
                    </p>
                    <button
                      onClick={() => setShowAddForm(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Create Schedule
                    </button>
                  </div>
                )}

                {/* Add Class Form */}
                {showAddForm && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h3 className="font-medium text-gray-900 mb-4">Add New Class</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Day
                        </label>
                        <select
                          value={newClass.dayOfWeek}
                          onChange={(e) =>
                            setNewClass({ ...newClass, dayOfWeek: Number(e.target.value) as DayOfWeek })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          {DAYS.map((day) => (
                            <option key={day.value} value={day.value}>
                              {day.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Subject
                        </label>
                        <select
                          value={newClass.questionSet}
                          onChange={(e) => setNewClass({ ...newClass, questionSet: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Select Subject</option>
                          {questionSets.map((qs) => (
                            <option key={qs._id} value={qs._id}>
                              {qs.title}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Start Time
                        </label>
                        <input
                          type="time"
                          value={newClass.startTime}
                          onChange={(e) => setNewClass({ ...newClass, startTime: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          End Time
                        </label>
                        <input
                          type="time"
                          value={newClass.endTime}
                          onChange={(e) => setNewClass({ ...newClass, endTime: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <button
                      onClick={handleAddClass}
                      className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Add Class
                    </button>
                  </div>
                )}

                {/* Schedule Display */}
                {schedule && (
                  <div className="space-y-6">
                    {DAYS.map((day) => (
                      <div key={day.value} className="border-b border-gray-200 last:border-0 pb-4 last:pb-0">
                        <h3 className="font-semibold text-gray-900 mb-3">{day.label}</h3>
                        
                        {groupedSchedule[day.value]?.length > 0 ? (
                          <div className="space-y-2">
                            {groupedSchedule[day.value].map((cls, index) => (
                              <div
                                key={`${cls._id}-${index}`}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                              >
                                <div className="flex-1">
                                  <div className="font-medium text-gray-900">{cls.questionSetTitle}</div>
                                  <div className="text-sm text-gray-600">
                                    {formatTime(cls.startTime)} - {formatTime(cls.endTime)}
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleRemoveClass(
                                    schedule?.weeklySchedule.findIndex(c => c === cls) || 0
                                  )}
                                  className="px-3 py-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                >
                                  Remove
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 text-sm italic">No classes scheduled</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Save Button */}
            {schedule && (
              <div className="flex justify-end">
                <button
                  onClick={handleSaveSchedule}
                  disabled={isSaving || !schedule || schedule.weeklySchedule.length === 0}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
                >
                  {isSaving ? 'Saving...' : 'Save Schedule'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
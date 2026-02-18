// Utility functions for attendance system

import { DayName, DayOfWeek } from '@/app/types/global';

// Format time from "19:00" to "7:00 PM"
export function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

// Format date to readable string
export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// Get short date format
export function formatShortDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// Format date to YYYY-MM-DD for API
export function formatDateForApi(date: Date): string {
  return date.toISOString().split('T')[0];
}

// Get today's date at midnight
export function getTodayDate(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

// Check if a session is happening now
export function isSessionActive(startTime: string, endTime: string): boolean {
  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  return currentTime >= startTime && currentTime <= endTime;
}

// Calculate time remaining for attendance window
export function getTimeRemaining(openedAt: string, durationMinutes: number): {
  isExpired: boolean;
  minutesLeft: number;
  secondsLeft: number;
  displayText: string;
} {
  const openTime = new Date(openedAt);
  const closeTime = new Date(openTime.getTime() + durationMinutes * 60 * 1000);
  const now = new Date();
  const diffMs = closeTime.getTime() - now.getTime();
  
  if (diffMs <= 0) {
    return {
      isExpired: true,
      minutesLeft: 0,
      secondsLeft: 0,
      displayText: 'Expired',
    };
  }
  
  const minutesLeft = Math.floor(diffMs / (60 * 1000));
  const secondsLeft = Math.floor((diffMs % (60 * 1000)) / 1000);
  
  return {
    isExpired: false,
    minutesLeft,
    secondsLeft,
    displayText: `${minutesLeft}m ${secondsLeft}s`,
  };
}

// Get relative time (e.g., "2 hours ago", "in 5 minutes")
export function getRelativeTime(date: string | Date): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const absDiffMs = Math.abs(diffMs);
  const isPast = diffMs < 0;
  
  const minutes = Math.floor(absDiffMs / (60 * 1000));
  const hours = Math.floor(absDiffMs / (60 * 60 * 1000));
  const days = Math.floor(absDiffMs / (24 * 60 * 60 * 1000));
  
  if (minutes < 1) return 'just now';
  if (minutes < 60) return isPast ? `${minutes} min ago` : `in ${minutes} min`;
  if (hours < 24) return isPast ? `${hours} hour${hours > 1 ? 's' : ''} ago` : `in ${hours} hour${hours > 1 ? 's' : ''}`;
  return isPast ? `${days} day${days > 1 ? 's' : ''} ago` : `in ${days} day${days > 1 ? 's' : ''}`;
}

// Convert day number to name
export function getDayName(dayOfWeek: DayOfWeek): DayName {
  const days: DayName[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayOfWeek];
}

// Get current day of week
export function getCurrentDayOfWeek(): DayOfWeek {
  return new Date().getDay() as DayOfWeek;
}

// Calculate attendance percentage
export function calculatePercentage(present: number, total: number): string {
  if (total === 0) return '0';
  return ((present / total) * 100).toFixed(1);
}

// Get status color classes
export function getStatusColor(status: 'present' | 'absent' | 'excused'): string {
  switch (status) {
    case 'present':
      return 'text-green-600 bg-green-50';
    case 'absent':
      return 'text-red-600 bg-red-50';
    case 'excused':
      return 'text-yellow-600 bg-yellow-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
}

// Get department color
export function getDepartmentColor(department: string): string {
  switch (department) {
    case 'Sciences':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'Arts':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'Commercial':
      return 'bg-green-100 text-green-800 border-green-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

// Check if date is today
export function isToday(date: string | Date): boolean {
  const d = new Date(date);
  const today = new Date();
  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  );
}

// Parse time string to minutes since midnight
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

// Compare if time1 is before time2
export function isTimeBefore(time1: string, time2: string): boolean {
  return timeToMinutes(time1) < timeToMinutes(time2);
}
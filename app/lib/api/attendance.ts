// API utilities for attendance system

import {
  Schedule,
  Department,
} from "@/app/types/global";


export const serverApi = {
  // Admin Server Functions
  admin: {
    async getDepartmentSchedule(department: Department) {
      const data = await fetch(`/api/attendance/schedules/${department}`, );
      if (!data.ok) {
        throw new Error("Failed to fetch department schedule");
      }
      const departmentSchedule: Schedule = await data.json();
      return departmentSchedule;
    },

    async getSessionsForDate(date: string) {
      const data = await fetch(`/api/attendance/sessions/${date}`);
      if (!data.ok) {
        throw new Error("Failed to fetch sessions for date");
      }
      const sessionsData = await data.json();
      return sessionsData;
    },

    async getAllSchedules() {
      const data = await fetch(`/api/attendance/schedules`);
      if (!data.ok) {
        throw new Error("Failed to fetch all schedules");
      }
      const schedules: Schedule[] = await data.json();
      return schedules;
    },
  },
};

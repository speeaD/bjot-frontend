/* eslint-disable @typescript-eslint/no-explicit-any */
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { serverApi } from '../lib/api/attendance';
import ScheduleManagerClient from './ScheduleManagerClient';
// import { Department } from '../types/global';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5004/api';

async function getSchedules(token: string) {
    try {
        const response = await fetch(`${BACKEND_URL}/attendance/admin/schedules`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },

            cache: 'no-store',
        });

        if (!response.ok) {
            throw new Error('Failed to fetch schedules');
        }

        const data = await response.json();
        return data.data;
    } catch (error) {
        console.error('Error fetching schedules:', error);
        return [];
    }
}

export default async function AdminSchedulePage() {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
        redirect('/admin/login');
    }
    const initialSchedules = await getSchedules(token);
    let error = null;

    try {

    } catch (err: any) {
        console.error('Failed to fetch schedules:', err);
        error = err.message;
    }

    return (
        <ScheduleManagerClient
            initialSchedules={initialSchedules || []}
            initialError={error}
        />
    );
}
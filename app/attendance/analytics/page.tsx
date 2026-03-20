import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import StudentAnalyticsClient from "./StudentAnalyticsClient";

interface PageProps {
  searchParams: {
    department: Promise<string>;
    startDate: Promise<string>;
    endDate: Promise<string>;
  };
}

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5004/api';

async function getDepartmentAnalytics(
  token: string, 
  department: string,
  startDate?: string, 
  endDate?: string
) {
  try {
    // ✅ Build URL with query parameters
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const queryString = params.toString();
    const url = `${BACKEND_URL}/attendance/admin/analytics/department/${department}${queryString ? `?${queryString}` : ''}`;
    
    console.log('Fetching department analytics:', url);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error('Failed to fetch department analytics:', response.statusText);
      throw new Error('Failed to fetch department analytics');
    }

    const data = await response.json();
    console.log('Fetched analytics data:', data);
    return data.data;
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return null;
  }
}

export default async function StudentAnalyticsPage({ searchParams }: PageProps) {
  // Await all search params
  const department = await searchParams.department
  const startDate = await searchParams.startDate
  const endDate = await searchParams.endDate
  
  let initialData = null;
  let error = null;

  // Get auth token
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;

  if (!token) {
    redirect('/admin/login');
  }

  // Fetch data if department is selected
  if (department) {
    try {
      initialData = await getDepartmentAnalytics(token, department, startDate, endDate);
      
      if (!initialData) {
        error = 'Failed to load analytics data';
      }
    } catch (err) {
      console.error('Error loading analytics:', err);
      error = 'Failed to load analytics data';
    }
  }

  return (
    <StudentAnalyticsClient 
      initialData={initialData}
      initialDepartment={department}
      initialStartDate={startDate}
      initialEndDate={endDate}
      initialError={error}
    />
  );
}
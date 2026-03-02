import { error } from "console";
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

async function getDepartmentAnalytics(token: string, startDate: string | undefined, endDate: string | undefined, department: string | undefined) {
  try {
    const response = await fetch(`${BACKEND_URL}/attendance/admin/analytics/department/${department}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },

      cache: 'no-store',
    });

    if (!response.ok) {
        console.error('Failed to fetch department analytics:', response.statusText);
      throw new Error('Failed to fetch sessions');
    }

    const data = await response.json();
    console.log('Fetched sessions data:', data);
    return data.data;
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return [];
  }
}


export default async function StudentAnalyticsPage({ searchParams }: PageProps) {
    const department = await searchParams.department;
    const startDate = await searchParams.startDate;
    const endDate = await searchParams.endDate;
    let initialData = null;

  const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
  
    if (!token) {
      redirect('/admin/login');
    }
  
  
  if(department) {
    initialData = await getDepartmentAnalytics(token, startDate, endDate, department);
  }
  


  return (
    <StudentAnalyticsClient 
      initialData={initialData}
      initialDepartment={department}
      initialStartDate={startDate}
      initialEndDate={endDate}
      initialError={null}
    />
  );
}
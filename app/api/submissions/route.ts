import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { AdminSubmissionsError, fetchAllAdminSubmissions } from '../../lib/admin-submissions';


const BACKEND_URL = process.env.BACKEND_URL;

export async function GET()
 {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!BACKEND_URL) throw new Error('Backend is not configured');
    const submissions = await fetchAllAdminSubmissions(BACKEND_URL, token);
    return NextResponse.json({ success: true, count: submissions.length, submissions }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('Error fetching submissions:', error);
    return NextResponse.json(
      { success: false, message: error instanceof AdminSubmissionsError ? error.message : 'Unable to load submissions' },
      { status: error instanceof AdminSubmissionsError ? error.status : 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
    try {
        const { token, admin } = await request.json();

        // Set httpOnly cookie for token (most secure)
        (await
            // Set httpOnly cookie for token (most secure)
            cookies()).set('auth-token', token, {
            httpOnly: true,  // Cannot be accessed by JavaScript
            secure: process.env.NODE_ENV === 'production', // HTTPS only in production
            sameSite: 'strict', // CSRF protection
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: '/',
        });

        // Optionally store admin info in a separate readable cookie
        (await
            // Optionally store admin info in a separate readable cookie
            cookies()).set('admin', JSON.stringify(admin), {
            httpOnly: false, // Accessible by JavaScript if needed
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 24 * 7,
            path: '/',
        });

        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json(
            { success: false, message: `Failed to set cookie: ${e}` },
            { status: 500 }
        );
    }
}
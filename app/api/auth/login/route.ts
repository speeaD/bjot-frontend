import { NextResponse } from 'next/server';

const DEFAULT_BACKEND_URL = 'https://bjot-backend-nine.vercel.app/api';

function getBackendUrl() {
    return (process.env.BACKEND_URL || DEFAULT_BACKEND_URL).replace(/\/$/, '');
}

export async function POST(request: Request) {
    try {
        const { email, password } = await request.json();

        if (typeof email !== 'string' || typeof password !== 'string') {
            return NextResponse.json(
                { success: false, message: 'Email and password are required.' },
                { status: 400 },
            );
        }

        const backendResponse = await fetch(`${getBackendUrl()}/auth/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
            cache: 'no-store',
        });

        const data = await backendResponse.json().catch(() => ({
            success: false,
            message: 'The authentication service returned an invalid response.',
        }));

        return NextResponse.json(data, { status: backendResponse.status });
    } catch {
        return NextResponse.json(
            { success: false, message: 'Unable to reach the authentication service.' },
            { status: 502 },
        );
    }
}

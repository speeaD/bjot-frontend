import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

type Context = { params: Promise<{ path: string[] }> };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const headers = { "Cache-Control": "private, no-store" };

async function forward(request: NextRequest, context: Context) {
  const { path } = await context.params;
  const route = path.join("/");
  const allowed = path.length === 1
    ? ({ subjects: ["GET"], books: ["GET"], uploads: ["POST"] } as Record<string, string[]>)[path[0]]
    : path[0] === "books" && UUID.test(path[1])
      ? path.length === 2 ? ["PATCH", "DELETE"]
        : path.length === 3 ? ({ complete: ["POST"], download: ["GET"] } as Record<string, string[]>)[path[2]] : undefined
      : undefined;
  if (!allowed) return NextResponse.json({ success: false, message: "Unknown textbook route" }, { status: 404, headers });
  if (!allowed.includes(request.method)) return NextResponse.json({ success: false, message: "Method not allowed" }, { status: 405, headers });
  const token = (await cookies()).get("auth-token")?.value;
  if (!token) return NextResponse.json({ success: false, message: "Administrator sign-in required" }, { status: 401, headers });
  const base = process.env.BACKEND_URL;
  if (!base) return NextResponse.json({ success: false, message: "Backend is not configured" }, { status: 503, headers });
  try {
    const response = await fetch(`${base.replace(/\/$/, "")}/textbooks/admin/${route}`, {
      method: request.method, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: ["POST", "PATCH"].includes(request.method) ? await request.text() : undefined, cache: "no-store",
    });
    const data = await response.json();
    if (response.ok && path[2] === "download") {
      return NextResponse.redirect(data.url, { status: 302, headers: { ...headers, "Referrer-Policy": "no-referrer" } });
    }
    return NextResponse.json(data, { status: response.status, headers });
  } catch {
    return NextResponse.json({ success: false, message: "Textbook service is unavailable. Check the backend deployment." }, { status: 502, headers });
  }
}

export const GET = forward;
export const POST = forward;
export const PATCH = forward;
export const DELETE = forward;

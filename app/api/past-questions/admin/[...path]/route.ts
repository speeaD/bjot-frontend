import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

type Context = { params: Promise<{ path: string[] }> };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function forward(request: NextRequest, context: Context) {
  const path = (await context.params).path;
  const route = path.join("/");
  const method = request.method;
  const file = method === "POST" && (route === "preview" || route === "papers/import");
  const allowed = file || (method === "GET" && (route === "papers" || (path.length === 2 && path[0] === "papers" && UUID.test(path[1])))) ||
    (method === "PATCH" && path[0] === "papers" && UUID.test(path[1]) &&
      ((path.length === 3 && path[2] === "publication") || (path.length === 4 && path[2] === "questions" && UUID.test(path[3]))));
  if (!allowed) return NextResponse.json({ success: false, message: "Unknown paper route" }, { status: 404 });
  const token = (await cookies()).get("auth-token")?.value;
  if (!token) return NextResponse.json({ success: false, message: "Administrator sign-in required" }, { status: 401 });
  const base = process.env.BACKEND_URL;
  if (!base) return NextResponse.json({ success: false, message: "Backend is not configured" }, { status: 503 });
  try {
    let body: BodyInit | undefined;
    if (file) {
      const form = await request.formData();
      const upload = form.get("file");
      if (!(upload instanceof File) || upload.size > 5 * 1024 * 1024)
        return NextResponse.json({ success: false, message: "Select a CSV file of at most 5 MB" }, { status: 400 });
      body = form;
    } else if (method === "PATCH") body = await request.text();
    const response = await fetch(`${base.replace(/\/$/, "")}/past-questions/admin/${route}`, {
      method, headers: { Authorization: `Bearer ${token}`, ...(!file && method === "PATCH" ? { "Content-Type": "application/json" } : {}) },
      body, cache: "no-store",
    });
    if (response.status === 404 && route === "papers") {
      return NextResponse.json({ success: false,
        message: "The configured backend does not have JAMB Past Questions yet. Deploy the backend update and migration, then refresh this page." }, { status: 502 });
    }
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      return NextResponse.json({ success: false, message: response.status === 404
        ? "The configured backend does not have JAMB Past Questions yet. Deploy the backend update and migration, then refresh this page."
        : "The backend returned an unexpected response. Check the backend deployment." }, { status: 502 });
    }
    return NextResponse.json(await response.json(), { status: response.status, headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ success: false, message: "Paper service is unavailable" }, { status: 502 });
  }
}

export const GET = forward;
export const POST = forward;
export const PATCH = forward;

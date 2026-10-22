import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { createR2Upload, validateCmsUpload } from "@/app/lib/r2Upload";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const token = (await cookies()).get("auth-token")?.value;
    if (!token) return NextResponse.json({ message: "Sign in to upload media." }, { status: 401 });
    if (!process.env.BACKEND_URL) return NextResponse.json({ message: "Backend is not configured." }, { status: 503 });
    if (!["R2_ACCOUNT_ID", "R2_BUCKET_NAME", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_PUBLIC_URL"].every((name) => process.env[name])) {
      return NextResponse.json({ message: "Media storage is not configured. Set the R2 environment variables." }, { status: 503 });
    }

    const input = await request.json() as { pathname?: unknown; contentType?: unknown; size?: unknown } | null;
    if (!input || typeof input.pathname !== "string" || typeof input.contentType !== "string" || typeof input.size !== "number") {
      return NextResponse.json({ message: "Invalid media upload request." }, { status: 400 });
    }
    const key = validateCmsUpload(input.pathname, input.contentType, input.size);
    const verification = await fetch(`${process.env.BACKEND_URL}/admin/content`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    if (!verification.ok) {
      const expired = verification.status === 401 || verification.status === 403;
      return NextResponse.json({ message: expired ? "Your admin session has expired. Sign in again." : "Admin verification is unavailable. Please retry the upload." }, { status: expired ? 401 : 503 });
    }
    return NextResponse.json(await createR2Upload(`cms/${key}`, input.contentType));
  } catch (error) {
    console.error("CMS media upload error:", error);
    const timedOut = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
    const badInput = error instanceof SyntaxError || error instanceof Error && /^(Unsupported media|Choose an? )/.test(error.message);
    return NextResponse.json({ message: timedOut ? "Admin verification timed out. Please retry the upload." : error instanceof Error ? error.message : "Media upload failed." }, { status: timedOut ? 504 : badInput ? 400 : 503 });
  }
}

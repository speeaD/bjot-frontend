import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { list } from "@vercel/blob";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL;

export async function POST(request: NextRequest) {
  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json({ message: "Media storage is not configured. Connect a Vercel Blob store to this project." }, { status: 503 });
    }

    const body = await request.json() as HandleUploadBody;
    if (body.type === "blob.generate-client-token") {
      const token = (await cookies()).get("auth-token")?.value;
      if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
      if (!BACKEND_URL) return NextResponse.json({ message: "Backend is not configured" }, { status: 503 });

      const response = await fetch(`${BACKEND_URL}/admin/content`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
      });
      if (!response.ok) return NextResponse.json({ message: response.status === 401 || response.status === 403 ? "Your admin session has expired. Sign in again." : "Admin verification is unavailable. Please retry the upload." }, { status: response.status === 401 || response.status === 403 ? 401 : 503 });

      try {
        await list({ limit: 1, abortSignal: AbortSignal.timeout(10000) });
      } catch (error) {
        console.error("CMS Blob store verification failed:", error);
        return NextResponse.json({ message: "Media storage rejected this project's credentials. Reconnect the Blob store and check BLOB_READ_WRITE_TOKEN in the production environment." }, { status: 503 });
      }
    }

    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        const safePath = /^cms\/(?:staff|testimonials\/(?:images|videos)|study-hub\/images)\/[a-zA-Z0-9._-]+$/.test(pathname) && !pathname.includes("..");
        if (!safePath) throw new Error("Unsupported media destination");
        const isImage = pathname.startsWith("cms/staff/") || pathname.startsWith("cms/testimonials/images/") || pathname.startsWith("cms/study-hub/images/");
        const isVideo = pathname.startsWith("cms/testimonials/videos/");
        if (!isImage && !isVideo) throw new Error("Unsupported media destination");
        return {
          allowedContentTypes: isVideo ? ["video/mp4", "video/webm"] : ["image/jpeg", "image/png", "image/webp"],
          maximumSizeInBytes: isVideo ? 100 * 1024 * 1024 : 5 * 1024 * 1024,
          addRandomSuffix: true,
        };
      },
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error("CMS media upload error:", error);
    const timedOut = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
    return NextResponse.json({ message: timedOut ? "Admin verification timed out. Please retry the upload." : error instanceof Error ? error.message : "Media upload failed" }, { status: timedOut ? 504 : 400 });
  }
}

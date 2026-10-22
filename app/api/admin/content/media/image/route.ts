import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { createR2Upload, MAX_CMS_IMAGE_BYTES, validateCmsUpload } from "@/app/lib/r2Upload";

export const runtime = "nodejs";

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request: NextRequest) {
  const token = (await cookies()).get("auth-token")?.value;
  if (!token) return NextResponse.json({ message: "Sign in to upload media." }, { status: 401 });
  if (!process.env.BACKEND_URL) return NextResponse.json({ message: "Backend is not configured." }, { status: 503 });

  const pathname = request.nextUrl.searchParams.get("pathname") ?? "";
  const contentType = request.headers.get("content-type")?.split(";")[0] ?? "";
  if (!IMAGE_TYPES.has(contentType)) return NextResponse.json({ message: "Choose a JPG, PNG, or WebP image." }, { status: 415 });
  if (Number(request.headers.get("content-length")) > MAX_CMS_IMAGE_BYTES) {
    return NextResponse.json({ message: "Choose an image under 4 MB." }, { status: 413 });
  }

  try {
    const verification = await fetch(`${process.env.BACKEND_URL}/admin/content`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    if (!verification.ok) {
      const expired = verification.status === 401 || verification.status === 403;
      return NextResponse.json({ message: expired ? "Your admin session has expired. Sign in again." : "Admin verification is unavailable. Please retry the upload." }, { status: expired ? 401 : 503 });
    }

    const image = await request.arrayBuffer();
    if (!image.byteLength || image.byteLength > MAX_CMS_IMAGE_BYTES) {
      return NextResponse.json({ message: "Choose an image under 4 MB." }, { status: 413 });
    }
    const key = `cms/${validateCmsUpload(pathname, contentType, image.byteLength)}`;
    const { uploadUrl, url } = await createR2Upload(key, contentType);
    const uploaded = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": contentType },
      body: Buffer.from(image),
      signal: AbortSignal.timeout(30000),
    });
    if (!uploaded.ok) {
      const details = await uploaded.text().catch(() => "");
      const code = details.match(/<Code>([^<]+)<\/Code>/)?.[1];
      console.error("CMS R2 image upload rejected:", uploaded.status, code ?? "UnknownError");
      const advice = code === "AccessDenied" ? "The R2 access key needs Object Read & Write permission for this bucket." : "Check the bucket credentials and permissions.";
      return NextResponse.json({ message: `R2 rejected the image upload (${uploaded.status}${code ? `: ${code}` : ""}). ${advice}` }, { status: 502 });
    }
    return NextResponse.json({ url });
  } catch (error) {
    console.error("CMS R2 image upload failed:", error);
    const timedOut = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
    const invalidPath = error instanceof Error && /^(Unsupported media|Choose an? )/.test(error.message);
    return NextResponse.json({ message: timedOut ? "Image upload timed out. Please retry." : invalidPath ? error.message : "R2 could not save the image. Check the frontend server log for details." }, { status: timedOut ? 504 : invalidPath ? 400 : 503 });
  }
}

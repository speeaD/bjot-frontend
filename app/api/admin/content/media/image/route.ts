import { BlobAccessError, BlobContentTypeNotAllowedError, BlobStoreNotFoundError, BlobStoreSuspendedError, put } from "@vercel/blob";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request: NextRequest) {
  const token = (await cookies()).get("auth-token")?.value;
  if (!token) return NextResponse.json({ message: "Sign in to upload media." }, { status: 401 });

  const backendUrl = process.env.BACKEND_URL;
  if (!backendUrl) return NextResponse.json({ message: "Backend is not configured." }, { status: 503 });
  if (!process.env.BLOB_READ_WRITE_TOKEN && !process.env.BLOB_STORE_ID) {
    return NextResponse.json({ message: "Media storage is not configured for this deployment." }, { status: 503 });
  }

  const pathname = request.nextUrl.searchParams.get("pathname") ?? "";
  const safePath = /^cms\/(?:staff|testimonials\/images|study-hub\/images)\/[a-zA-Z0-9._-]+$/.test(pathname) && !pathname.includes("..");
  if (!safePath) return NextResponse.json({ message: "Unsupported media destination." }, { status: 400 });

  const contentType = request.headers.get("content-type")?.split(";")[0] ?? "";
  if (!IMAGE_TYPES.has(contentType)) return NextResponse.json({ message: "Choose a JPG, PNG, or WebP image." }, { status: 415 });
  if (Number(request.headers.get("content-length")) > MAX_IMAGE_BYTES) {
    return NextResponse.json({ message: "Choose an image under 4 MB." }, { status: 413 });
  }

  let verification: Response;
  try {
    verification = await fetch(`${backendUrl}/admin/content`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
  } catch (error) {
    console.error("CMS admin verification failed:", error);
    return NextResponse.json({ message: "Admin verification is unavailable. Please retry the upload." }, { status: 503 });
  }
  if (!verification.ok) {
    return NextResponse.json({ message: verification.status === 401 || verification.status === 403 ? "Your admin session has expired. Sign in again." : "Admin verification is unavailable. Please retry the upload." }, { status: verification.status === 401 || verification.status === 403 ? 401 : 503 });
  }

  try {
    const image = await request.arrayBuffer();
    if (!image.byteLength || image.byteLength > MAX_IMAGE_BYTES) {
      return NextResponse.json({ message: "Choose an image under 4 MB." }, { status: 413 });
    }
    const blob = await put(pathname, Buffer.from(image), {
      access: "public",
      addRandomSuffix: true,
      contentType,
    });
    return NextResponse.json({ url: blob.url });
  } catch (error) {
    console.error("CMS image upload failed:", error);
    const timedOut = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
    if (error instanceof BlobAccessError || error instanceof BlobStoreNotFoundError) {
      return NextResponse.json({ message: "Blob store credentials are invalid or the store is disconnected from this deployment. Reconnect the store in Vercel Storage and redeploy." }, { status: 503 });
    }
    if (error instanceof BlobStoreSuspendedError) {
      return NextResponse.json({ message: "The connected Blob store is suspended. Check its status in Vercel Storage." }, { status: 503 });
    }
    if (error instanceof BlobContentTypeNotAllowedError) {
      return NextResponse.json({ message: "This Blob store rejected the image type. Choose a JPG, PNG, or WebP image." }, { status: 415 });
    }
    return NextResponse.json({ message: timedOut ? "Upload timed out. Please retry." : "Blob storage could not save the image. Check the Vercel Function log for ‘CMS image upload failed’ and the store connection." }, { status: timedOut ? 504 : 502 });
  }
}

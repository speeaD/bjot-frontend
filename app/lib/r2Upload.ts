import { randomUUID } from "node:crypto";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const VIDEO_TYPES = new Set(["video/mp4", "video/webm"]);
export const MAX_CMS_IMAGE_BYTES = 4 * 1024 * 1024;
export const MAX_CMS_VIDEO_BYTES = 100 * 1024 * 1024;

export function validateCmsUpload(pathname: string, contentType: string, size: number) {
  const match = /^cms\/(staff|testimonials\/images|testimonials\/videos|study-hub\/images)\/([a-zA-Z0-9._-]+)$/.exec(pathname);
  if (!match || match[2].includes("..")) throw new Error("Unsupported media destination.");
  const isVideo = match[1] === "testimonials/videos";
  const types = isVideo ? VIDEO_TYPES : IMAGE_TYPES;
  const maximum = isVideo ? MAX_CMS_VIDEO_BYTES : MAX_CMS_IMAGE_BYTES;
  if (!types.has(contentType)) throw new Error(isVideo ? "Choose an MP4 or WebM video." : "Choose a JPG, PNG, or WebP image.");
  if (!Number.isSafeInteger(size) || size < 1 || size > maximum) {
    throw new Error(isVideo ? "Choose a video under 100 MB." : "Choose an image under 4 MB.");
  }
  return `${match[1]}/${randomUUID()}-${match[2]}`;
}

export async function createR2Upload(key: string, contentType: string) {
  const accountId = process.env.R2_ACCOUNT_ID;
  const bucket = process.env.R2_BUCKET_NAME;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const publicBase = process.env.R2_PUBLIC_URL;
  const jurisdiction = process.env.R2_JURISDICTION || "default";
  if (!accountId || !bucket || !accessKeyId || !secretAccessKey || !publicBase) {
    throw new Error("Media storage is not configured. Set the R2 environment variables.");
  }
  if (!/^[a-f0-9]{32}$/i.test(accountId) || !/^[a-z0-9][a-z0-9.-]*$/.test(bucket)) {
    throw new Error("R2 account ID or bucket name is invalid.");
  }
  if (!["default", "us", "eu", "fedramp"].includes(jurisdiction)) {
    throw new Error("R2_JURISDICTION must be default, us, eu, or fedramp.");
  }
  const publicUrl = new URL(publicBase);
  if (publicUrl.protocol !== "https:" || publicUrl.pathname !== "/" || publicUrl.search || publicUrl.hash || publicUrl.username || publicUrl.password) {
    throw new Error("R2_PUBLIC_URL must be a public HTTPS base URL.");
  }

  const client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.${jurisdiction === "default" ? "" : `${jurisdiction}.`}r2.cloudflarestorage.com`,
    forcePathStyle: true,
    requestChecksumCalculation: "WHEN_REQUIRED",
    credentials: { accessKeyId, secretAccessKey },
  });
  const uploadUrl = await getSignedUrl(client, new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType }), {
    expiresIn: 300,
    signableHeaders: new Set(["content-type"]),
  });
  client.destroy();
  const base = publicUrl.href.endsWith("/") ? publicUrl.href : `${publicUrl.href}/`;
  return { uploadUrl, url: new URL(key, base).href };
}

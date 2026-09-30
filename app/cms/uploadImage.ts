export const MAX_CMS_IMAGE_BYTES = 4 * 1024 * 1024;

export async function uploadCmsImage(pathname: string, file: File, signal?: AbortSignal): Promise<string> {
  const response = await fetch(`/api/admin/content/media/image?pathname=${encodeURIComponent(pathname)}`, {
    method: "POST",
    headers: { "Content-Type": file.type },
    body: file,
    signal,
  });
  const result = await response.json().catch(() => ({})) as { url?: string; message?: string };
  if (!response.ok || !result.url) {
    throw new Error(result.message || "Image upload failed. Please retry.");
  }
  return result.url;
}

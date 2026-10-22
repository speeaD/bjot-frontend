export const MAX_CMS_IMAGE_BYTES = 4 * 1024 * 1024;

export async function uploadCmsMedia(pathname: string, file: File, signal?: AbortSignal, onProgress?: (percentage: number) => void): Promise<string> {
  const response = await fetch("/api/admin/content/media", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pathname, contentType: file.type, size: file.size }),
    signal,
  });
  const result = await response.json().catch(() => ({})) as { uploadUrl?: string; url?: string; message?: string };
  if (!response.ok || !result.uploadUrl || !result.url) {
    throw new Error(result.message || "Could not prepare the media upload.");
  }

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const abort = () => xhr.abort();
    signal?.addEventListener("abort", abort, { once: true });
    xhr.open("PUT", result.uploadUrl!);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress?.(Math.round(event.loaded / event.total * 100));
    };
    xhr.onload = () => {
      signal?.removeEventListener("abort", abort);
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`R2 upload failed (${xhr.status}). Check the bucket CORS policy and credentials.`));
    };
    xhr.onerror = () => { signal?.removeEventListener("abort", abort); reject(new Error("R2 upload failed. Check the bucket CORS policy and your connection.")); };
    xhr.onabort = () => { signal?.removeEventListener("abort", abort); reject(new DOMException("Upload aborted.", "AbortError")); };
    if (signal?.aborted) abort();
    else xhr.send(file);
  });
  return result.url;
}

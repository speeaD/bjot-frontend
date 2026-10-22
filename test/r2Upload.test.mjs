import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createR2Upload, validateCmsUpload } from '../app/lib/r2Upload.ts';

test('R2 upload URL points to the configured bucket and public domain', async () => {
  const original = Object.fromEntries(['R2_ACCOUNT_ID', 'R2_BUCKET_NAME', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_PUBLIC_URL', 'R2_JURISDICTION'].map((name) => [name, process.env[name]]));
  try {
    Object.assign(process.env, {
      R2_ACCOUNT_ID: 'a'.repeat(32), R2_BUCKET_NAME: 'bjot-media',
      R2_ACCESS_KEY_ID: 'test-key', R2_SECRET_ACCESS_KEY: 'test-secret',
      R2_PUBLIC_URL: 'https://media.example.com',
      R2_JURISDICTION: 'default',
    });
    const key = `cms/${validateCmsUpload('cms/testimonials/videos/story.mp4', 'video/mp4', 1000)}`;
    const { uploadUrl, url } = await createR2Upload(key, 'video/mp4');
    const signed = new URL(uploadUrl);
    assert.equal(signed.hostname, `${'a'.repeat(32)}.r2.cloudflarestorage.com`);
    assert.equal(signed.pathname, `/bjot-media/${key}`);
    assert.equal(signed.searchParams.get('X-Amz-Expires'), '300');
    assert.equal(signed.searchParams.get('X-Amz-SignedHeaders'), 'content-type;host');
    assert.equal(url, `https://media.example.com/${key}`);
    process.env.R2_JURISDICTION = 'us';
    const usSigned = new URL((await createR2Upload(key, 'video/mp4')).uploadUrl);
    assert.equal(usSigned.hostname, `${'a'.repeat(32)}.us.r2.cloudflarestorage.com`);
    process.env.R2_JURISDICTION = 'invalid';
    await assert.rejects(createR2Upload(key, 'video/mp4'), /R2_JURISDICTION/);
  } finally {
    for (const [name, value] of Object.entries(original)) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
});

test('CMS upload validation restricts paths, types, and sizes', () => {
  assert.throws(() => validateCmsUpload('cms/staff/../bad.jpg', 'image/jpeg', 10));
  assert.throws(() => validateCmsUpload('cms/staff/photo.jpg', 'video/mp4', 10));
  assert.throws(() => validateCmsUpload('cms/testimonials/videos/video.mp4', 'video/mp4', 101 * 1024 * 1024));
  assert.throws(() => validateCmsUpload('cms/staff/photo.jpg', 'image/jpeg', 0));
});

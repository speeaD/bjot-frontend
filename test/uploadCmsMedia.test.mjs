import assert from 'node:assert/strict';
import { test } from 'node:test';
import { uploadCmsMedia } from '../app/cms/uploadImage.ts';

test('diagram images upload through the admin server rather than cross-origin R2', async () => {
  const originalFetch = globalThis.fetch;
  const file = new File(['diagram'], 'levels.jpg', { type: 'image/jpeg' });
  let progress = 0;
  try {
    globalThis.fetch = async (input, init) => {
      assert.equal(input, '/api/admin/content/media/image?pathname=cms%2Fstudy-hub%2Fimages%2Flevels.jpg');
      assert.equal(init.method, 'POST');
      assert.equal(init.headers['Content-Type'], 'image/jpeg');
      assert.equal(init.body, file);
      return Response.json({ url: 'https://media.example.com/cms/study-hub/images/levels.jpg' });
    };
    const url = await uploadCmsMedia('cms/study-hub/images/levels.jpg', file, undefined, (value) => { progress = value; });
    assert.equal(url, 'https://media.example.com/cms/study-hub/images/levels.jpg');
    assert.equal(progress, 100);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('diagram upload shows R2 rejection returned by the admin server', async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () => Response.json({ message: 'R2 rejected the image upload (403: AccessDenied).' }, { status: 502 });
    await assert.rejects(uploadCmsMedia('cms/study-hub/images/levels.jpg', new File(['diagram'], 'levels.jpg', { type: 'image/jpeg' })), /403: AccessDenied/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

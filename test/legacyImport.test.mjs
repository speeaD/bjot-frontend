import test from 'node:test';
import assert from 'node:assert/strict';
import { importWithLegacyRoutes, LegacyImportError } from '../app/api/questionset/topics/import/legacyImport.ts';

const question = (topic, explanation) => ({
  topic, question: `Question in ${topic}?`, options: ['One', 'Two', 'Three', 'Four'],
  correctLetter: 'B', explanation,
});
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

test('imports several topics through deployed legacy routes and saves explanations', async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, init) => {
    const path = new URL(url).pathname;
    calls.push({ path, method: init.method, body: init.body });
    if (path.endsWith('/bulk-upload')) return json({ questionSet: { id: 'set-1', title: 'Physics', topics: [{ id: 'topic-1', name: 'Mechanics', isActive: true }], questions: [{ id: 'q1', orderNum: 1 }] } }, 201);
    if (path.endsWith('/set-1/topics')) return json({ topic: { id: 'topic-2', name: 'Heat', isActive: true } }, 201);
    if (path.endsWith('/topic-2/questions')) return json({ questionSet: { id: 'set-1', title: 'Physics', topics: [{ id: 'topic-1', name: 'Mechanics', isActive: true }, { id: 'topic-2', name: 'Heat', isActive: true }], questions: [{ id: 'q1', orderNum: 1 }, { id: 'q2', orderNum: 2 }] } }, 201);
    if (path.endsWith('/questions/q1/metadata') || path.endsWith('/questions/q2/metadata')) return json({ success: true });
    throw new Error(`Unexpected path ${path}`);
  };
  try {
    const result = await importWithLegacyRoutes('https://example.test/api', 'test-token', { title: 'Physics', questions: [question('Mechanics', 'Law one'), question('Heat', 'Law two')] });
    assert.equal(result.count, 2);
    assert.deepEqual(result.topics, ['Mechanics', 'Heat']);
    assert.equal(result.warning, undefined);
    assert.equal(calls.filter((call) => call.method === 'PUT').length, 2);
    assert.equal(JSON.parse(calls.find((call) => call.path.endsWith('/questions/q2/metadata')).body).metadata.explanation, 'Law two');
  } finally { globalThis.fetch = originalFetch; }
});

test('reports which questions were saved if a later topic fails', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    const path = new URL(url).pathname;
    if (path.endsWith('/bulk-upload')) return json({ questionSet: { id: 'set-1', title: 'Physics', topics: [{ id: 'topic-1', name: 'Mechanics', isActive: true }], questions: [{ id: 'q1', orderNum: 1 }] } }, 201);
    if (path.endsWith('/set-1/topics')) return json({ message: 'Topic creation failed' }, 500);
    throw new Error(`Unexpected path ${path}`);
  };
  try {
    await assert.rejects(
      importWithLegacyRoutes('https://example.test/api', 'test-token', { title: 'Physics', questions: [question('Mechanics', ''), question('Heat', '')] }),
      (error) => error instanceof LegacyImportError && error.partial?.id === 'set-1' && error.partial.publishedIndices[0] === 0,
    );
  } finally { globalThis.fetch = originalFetch; }
});

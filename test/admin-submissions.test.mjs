import test from 'node:test';
import assert from 'node:assert/strict';
import { AdminSubmissionsError, fetchAllAdminSubmissions, isLeaderboardSubmission, leaderboardSubjectKey, leaderboardSubjects, normalizeAdminQuizzes, normalizeAdminSubmission } from '../app/lib/admin-submissions.ts';

const assigned = { id: 'submission-1', quizId: 'quiz-1', quiz: { id: 'quiz-1', title: 'Assigned mock' },
  quizTakerId: 'student-1', quizTaker: { id: 'student-1', name: 'Student', accessCode: 'ABC123456' },
  score: 3, totalPoints: 4, percentage: '75.00', status: 'auto-graded', submittedAt: '2026-11-05T10:00:00Z' };
const publicAttempt = { ...assigned, id: 'public-attempt-1', source: 'public', quizTakerId: 'public:guest@example.com',
  quizTaker: { id: 'public:guest@example.com', name: 'Guest', email: 'guest@example.com', accessCode: null }, countsForGrade: true };

test('current database records normalize to the IDs and numeric scores the leaderboard uses', () => {
  const row = normalizeAdminSubmission(assigned);
  assert.equal(row._id, 'submission-1');
  assert.equal(row.quizId._id, 'quiz-1');
  assert.equal(row.quizId.settings.title, 'Assigned mock');
  assert.equal(row.quizTakerId._id, 'student-1');
  assert.equal(row.percentage, 75);
  assert.equal(isLeaderboardSubmission(row), true);
});

test('legacy populated submissions remain readable', () => {
  const row = normalizeAdminSubmission({ _id: 'old-submission', quizId: { _id: 'old-quiz', settings: { title: 'Old mock' } },
    quizTakerId: { _id: 'old-student', name: 'Legacy', accessCode: 'OLD123456' }, percentage: 50, totalPoints: 4, score: 2 });
  assert.equal(row.quizId.settings.title, 'Old mock');
  assert.equal(row.quizTakerId._id, 'old-student');
  assert.equal(isLeaderboardSubmission(row), true);
});

test('public candidates have a stable identity and do not require an access code', () => {
  const row = normalizeAdminSubmission(publicAttempt);
  assert.equal(row.source, 'public');
  assert.equal(row.quizTakerId._id, 'public:guest@example.com');
  assert.equal(row.quizTakerId.accessCode, '');
  assert.equal(isLeaderboardSubmission(row), true);
});

test('public replays and unfinished assigned attempts cannot inflate rankings', () => {
  assert.equal(isLeaderboardSubmission(normalizeAdminSubmission({ ...publicAttempt, countsForGrade: false })), false);
  assert.equal(isLeaderboardSubmission(normalizeAdminSubmission({ ...assigned, status: 'in-progress' })), false);
});

test('all submission pages are fetched fresh so an older first score is not hidden by recent replays', async () => {
  const requests = [];
  const rows = await fetchAllAdminSubmissions('https://backend.example/api/', 'test-token', async (url, options) => {
    const page = Number(new URL(url).searchParams.get('page'));
    requests.push(page);
    assert.equal(options.cache, 'no-store');
    assert.equal(options.headers.Authorization, 'Bearer test-token');
    return { ok: true, json: async () => ({ success: true, pages: 2, submissions: page === 1
      ? [{ ...publicAttempt, id: 'replay', countsForGrade: false }] : [publicAttempt, assigned] }) };
  });
  assert.deepEqual(requests, [1, 2]);
  assert.equal(rows.length, 3);
  assert.deepEqual(rows.filter(isLeaderboardSubmission).map((row) => row._id), ['public-attempt-1', 'submission-1']);
});

test('submission loading reports authorization and malformed responses as errors', async () => {
  await assert.rejects(fetchAllAdminSubmissions('https://backend.example/api', 'token', async () => ({
    ok: false, status: 401, json: async () => ({ message: 'Invalid token' }),
  })), (error) => error instanceof AdminSubmissionsError && error.status === 401);
  await assert.rejects(fetchAllAdminSubmissions('https://backend.example/api', 'token', async () => ({
    ok: true, json: async () => ({ success: true }),
  })), (error) => error.status === 502);
});

test('exam selectors accept current and legacy quiz references', () => {
  assert.deepEqual(normalizeAdminQuizzes([{ id: 'new', title: 'New mock' }, { _id: 'old', settings: { title: 'Old mock' } }]), [
    { _id: 'new', settings: { title: 'New mock' } }, { _id: 'old', settings: { title: 'Old mock' } },
  ]);
});

test('leaderboard subject filters use real subject identities across exams and support subjects beyond the first four', () => {
  const rows = [normalizeAdminSubmission({ ...assigned, questionSetSubmissions: [
    { questionSetOrder: 1, questionSetId: 'english', questionSetTitle: 'Use of English', score: 8, percentage: 80 },
    { questionSetOrder: 5, questionSetId: 'physics', questionSetTitle: 'Physics', score: 7, percentage: 70 },
  ] }), normalizeAdminSubmission({ ...publicAttempt, quiz: { id: 'quiz-2', title: 'Different exam' }, questionSetSubmissions: [
    { questionSetOrder: 1, questionSetId: 'physics', questionSetTitle: 'Physics', score: 6, percentage: 60 },
    { questionSetOrder: 3, questionSetId: 'biology', questionSetTitle: 'Biology', score: 5, percentage: 50 },
  ] })];
  const subjects = leaderboardSubjects(rows);
  assert.deepEqual(subjects.map((subject) => subject.title), ['Biology', 'Physics', 'Use of English']);
  const physics = subjects.find((subject) => subject.title === 'Physics');
  assert.deepEqual(rows.flatMap((row) => row.questionSetSubmissions.filter((set) => leaderboardSubjectKey(set, row.quizId._id) === physics.id).map((set) => set.score)), [7, 6]);
  assert.deepEqual(leaderboardSubjects([rows[0]]).map((subject) => subject.title), ['Physics', 'Use of English']);
});

test('historical scores without a subject ID never combine unrelated exams by set position', () => {
  const score = { questionSetOrder: 1, score: 1, percentage: 10 };
  assert.notEqual(leaderboardSubjectKey(score, 'english-exam'), leaderboardSubjectKey(score, 'physics-exam'));
  const row = normalizeAdminSubmission({ ...assigned, questionSetSubmissions: [score] });
  assert.deepEqual(leaderboardSubjects([row]).map((subject) => subject.title), ['Unknown subject']);
});

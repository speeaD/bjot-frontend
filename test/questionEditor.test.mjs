import test from 'node:test';
import assert from 'node:assert/strict';
import { answerIndexFor, buildQuestionUpdate, toDraft } from '../app/question-set/[id]/questions/questionEditor.ts';

test('handles old letter answers and changes only the topic', () => {
  const question = { id: 'q1', type: 'multiple-choice', question: 'Old question?', options: ['First', 'Second', 'Third'], correctAnswer: 'B', points: 1, orderNum: 1, topicId: null, metadata: { source: 'legacy' } };
  const draft = toDraft(question);
  assert.equal(draft.answerIndex, 1);
  draft.topicId = 'topic-1';
  assert.deepEqual(buildQuestionUpdate(question, draft), { changes: { topicId: 'topic-1' }, errors: [] });
});

test('saves edited option text as the answer and preserves other metadata', () => {
  const question = { id: 'q2', type: 'multiple-choice', question: 'Question?', options: { A: 'One', B: 'Two' }, correctAnswer: 'B', points: 1, orderNum: 2, metadata: { source: 'exam-2024', explanation: 'Old explanation' } };
  const draft = toDraft(question);
  draft.options[1] = 'Two updated';
  draft.explanation = 'New explanation';
  const result = buildQuestionUpdate(question, draft);
  assert.deepEqual(result.errors, []);
  assert.equal(result.changes.correctAnswer, 'Two updated');
  assert.deepEqual(result.changes.metadata, { source: 'exam-2024', explanation: 'New explanation' });
  assert.deepEqual(result.changes.options, ['One', 'Two updated']);
});

test('letter answers follow the backend grading rule even if option text is a letter', () => {
  assert.equal(answerIndexFor(['B', 'Other'], 'B'), 1);
});

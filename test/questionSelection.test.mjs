import test from 'node:test';
import assert from 'node:assert/strict';
import { questionIdsInRange, questionFilterFor } from '../app/lib/questionSelection.ts';

const questions = [
  { id: 'q10', orderNum: 10 },
  { id: 'q30', orderNum: 30 },
  { id: 'q40', orderNum: 40 },
  { id: 'q90', orderNum: 90 },
];

test('ranges include both endpoints using displayed positions rather than stored question numbers', () => {
  assert.deepEqual(questionIdsInRange(questions, '2', '3'), ['q30', 'q40']);
  assert.deepEqual(questionIdsInRange(questions, '1', '4'), ['q10', 'q30', 'q40', 'q90']);
  assert.deepEqual(questionIdsInRange(questions, '4', '4'), ['q90']);
});

test('invalid and empty ranges cannot silently select a different set of questions', () => {
  for (const [from, to] of [['', '2'], ['1', ''], ['0', '2'], ['-1', '2'], ['3', '2'], ['1', '5'], ['1.5', '3'], ['1', '2.5'], ['NaN', '3'], ['1e0', '3'], ['1', 'Infinity'], ['1', '9007199254740993']]) {
    assert.throws(() => questionIdsInRange(questions, from, to), /whole question numbers/);
  }
  assert.throws(() => questionIdsInRange([], '1', '1'), /whole question numbers/);
});

test('topic ranges are submitted as exact IDs and counts with no random extra questions', () => {
  const ids = questionIdsInRange(questions, '2', '3');
  const filter = questionFilterFor({ topicSelections: [{ topicId: 'motion', questionCount: 99, questionIds: ids }] });
  assert.deepEqual(filter, { topicSelections: [{ topicId: 'motion', questionCount: 2, questionIds: ['q30', 'q40'] }] });
});

test('ranges for subjects without topics use the exact question-ID filter and survive draft serialization', () => {
  const selection = { questionSetId: 'physics', topicSelections: [], questionIds: questionIdsInRange(questions, '2', '4') };
  const restored = JSON.parse(JSON.stringify(selection));
  assert.deepEqual(questionFilterFor(restored), { questionIds: ['q30', 'q40', 'q90'] });
  assert.equal(questionFilterFor({ topicSelections: [] }), undefined);
});

test('manual changes after a range and independent topic selections are preserved in the payload', () => {
  const filter = questionFilterFor({ topicSelections: [
    { topicId: 'motion', questionIds: ['q30', 'q90'] },
    { topicId: 'waves', questionIds: ['other-q'] },
  ] });
  assert.deepEqual(filter.topicSelections.map(({ questionCount }) => questionCount), [2, 1]);
  assert.deepEqual(filter.topicSelections[0].questionIds, ['q30', 'q90']);
  assert.deepEqual(filter.topicSelections[1].questionIds, ['other-q']);
});

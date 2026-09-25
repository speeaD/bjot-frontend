import test from 'node:test';
import assert from 'node:assert/strict';
import { parseQuestions, validateDraft } from '../app/question-organizer/parseQuestions.ts';

test('parses numbered questions, hidden spaces, answers, and multiline explanations', () => {
  const source = `Topic: Mechanics
1. The extension of a spring was 0.56 cm.
​A. 1.12 cm
​B. 2.14 cm
​C. 2.24 cm
​D. 2.52 cm
Correct Answer: C
Explanation: Hooke's law applies.
e₂ = (20 × 0.56) / 5 = 2.24 cm.

Topic: Heat
2. Why does glass crack?
A. Heat capacity
B. Uneven expansion
C. Chemical reaction
D. High conductivity
Correct Answer: B
Explanation: The inner surface expands first.`;
  const result = parseQuestions(source);
  assert.equal(result.questions.length, 2);
  assert.deepEqual(result.warnings, []);
  assert.equal(result.questions[0].options[2], '2.24 cm');
  assert.match(result.questions[0].explanation, /e₂ =/);
  assert.equal(result.questions[0].topic, 'Mechanics');
  assert.equal(result.questions[1].topic, 'Heat');
  assert.deepEqual(validateDraft(result.questions[0]), []);
});

test('keeps incomplete questions visible for repair', () => {
  const result = parseQuestions('1. Incomplete question\nA. First option\nCorrect Answer: A');
  assert.equal(result.questions.length, 1);
  assert.equal(result.warnings.length, 1);
  assert.ok(validateDraft(result.questions[0]).includes('Assign a topic'));
});

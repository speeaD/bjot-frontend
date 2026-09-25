export type DraftQuestion = {
  sourceNumber: number;
  question: string;
  options: [string, string, string, string];
  correctLetter: 'A' | 'B' | 'C' | 'D' | '';
  explanation: string;
  topic: string;
};

export type ParseResult = { questions: DraftQuestion[]; warnings: string[] };

const LETTERS = ['A', 'B', 'C', 'D'] as const;
const clean = (value: string) => value.replace(/[\u200B-\u200D\uFEFF]/g, '').trim();

export function validateDraft(question: DraftQuestion): string[] {
  const problems: string[] = [];
  if (!question.question.trim()) problems.push('Question text is missing');
  LETTERS.forEach((letter, index) => {
    if (!question.options[index].trim()) problems.push(`Option ${letter} is missing`);
  });
  if (!question.correctLetter || !LETTERS.includes(question.correctLetter as typeof LETTERS[number])) {
    problems.push('Choose a correct answer');
  }
  if (!question.topic.trim()) problems.push('Assign a topic');
  return problems;
}

export function parseQuestions(input: string): ParseResult {
  const lines = input.replace(/\r\n?/g, '\n').split('\n').map(clean);
  const questions: DraftQuestion[] = [];
  const warnings: string[] = [];
  let topic = '';
  let current: DraftQuestion | null = null;
  let mode: 'question' | 'option' | 'explanation' = 'question';
  let optionIndex = -1;

  const finish = () => {
    if (!current) return;
    current.question = current.question.trim();
    current.options = current.options.map((value) => value.trim()) as DraftQuestion['options'];
    current.explanation = current.explanation.trim();
    if (!current.question || current.options.some((value) => !value) || !current.correctLetter) {
      warnings.push(`Question ${current.sourceNumber} needs review: missing text, options, or answer.`);
    }
    questions.push(current);
  };

  for (const line of lines) {
    if (!line) continue;
    const number = line.match(/^(\d+)[.)]\s+(.+)$/);
    if (number) {
      finish();
      current = {
        sourceNumber: Number(number[1]), question: number[2],
        options: ['', '', '', ''], correctLetter: '', explanation: '', topic,
      };
      mode = 'question';
      optionIndex = -1;
      continue;
    }
    const heading = line.match(/^(?:topic|section)\s*:\s*(.+)$/i);
    if (heading && (!current || mode === 'explanation')) {
      if (current) { finish(); current = null; }
      topic = heading[1].trim();
      continue;
    }
    if (!current) {
      warnings.push(`Unrecognized text before question ${questions.length + 1}: ${line.slice(0, 80)}`);
      continue;
    }
    const option = line.match(/^([A-D])[.)]\s+(.+)$/i);
    if (option && mode !== 'explanation') {
      optionIndex = LETTERS.indexOf(option[1].toUpperCase() as typeof LETTERS[number]);
      current.options[optionIndex] = option[2];
      mode = 'option';
      continue;
    }
    const answer = line.match(/^Correct\s+Answer\s*:\s*([A-D])\b/i);
    if (answer) {
      current.correctLetter = answer[1].toUpperCase() as DraftQuestion['correctLetter'];
      mode = 'question';
      optionIndex = -1;
      continue;
    }
    const explanation = line.match(/^Explanation\s*:\s*(.*)$/i);
    if (explanation) {
      current.explanation = explanation[1];
      mode = 'explanation';
      continue;
    }
    if (mode === 'explanation') current.explanation += `${current.explanation ? '\n' : ''}${line}`;
    else if (mode === 'option' && optionIndex >= 0) current.options[optionIndex] += ` ${line}`;
    else current.question += ` ${line}`;
  }
  finish();
  if (!questions.length) warnings.push('No numbered questions were found. Use 1. Question, A. through D., Correct Answer: A, and Explanation:.');
  return { questions, warnings };
}

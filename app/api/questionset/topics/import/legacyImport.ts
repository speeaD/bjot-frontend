type InputQuestion = {
  question: string;
  options: string[];
  correctLetter: string;
  explanation: string;
  topic: string;
};
type Topic = { id: string; name: string; isActive: boolean };
type SavedQuestion = { id: string; orderNum: number };
type QuestionSet = { id: string; title: string; topics: Topic[]; questions: SavedQuestion[] };
type ImportPayload = { questionSetId?: string; title?: string; questions: InputQuestion[] };
type ImportResult = { id: string; title: string; count: number; topics: string[]; warning?: string };

export class LegacyImportError extends Error {
  partial?: { id: string; publishedIndices: number[] };
  constructor(message: string, partial?: { id: string; publishedIndices: number[] }) {
    super(message);
    this.partial = partial;
  }
}

function normalize(input: unknown): ImportPayload {
  const payload = input as Partial<ImportPayload> | null;
  const questionSetId = typeof payload?.questionSetId === 'string' ? payload.questionSetId.trim() : '';
  const title = typeof payload?.title === 'string' ? payload.title.trim() : '';
  if (!questionSetId && (!title || title.length > 255)) throw new LegacyImportError('Choose a subject or enter a subject name of 255 characters or fewer.');
  if (!Array.isArray(payload?.questions) || !payload.questions.length || payload.questions.length > 500) throw new LegacyImportError('Provide between 1 and 500 questions.');
  const questions = payload.questions.map((item, index) => {
    const question = typeof item?.question === 'string' ? item.question.trim() : '';
    const topic = typeof item?.topic === 'string' ? item.topic.trim() : '';
    const options = Array.isArray(item?.options) ? item.options.map((value) => typeof value === 'string' ? value.trim() : '') : [];
    const correctLetter = typeof item?.correctLetter === 'string' ? item.correctLetter.trim().toUpperCase() : '';
    const explanation = typeof item?.explanation === 'string' ? item.explanation.trim() : '';
    if (!question || question.length > 10000 || !topic || topic.length > 255 || options.length !== 4 || options.some((value) => !value || value.length > 2000) || !/^[A-D]$/.test(correctLetter) || explanation.length > 10000) {
      throw new LegacyImportError(`Question ${index + 1} has missing or invalid text, options, answer, topic, or explanation.`);
    }
    return { question, topic, options, correctLetter, explanation };
  });
  return { questionSetId, title, questions };
}

const csvCell = (value: string) => `"${value.replaceAll('"', '""')}"`;
const answerText = (item: InputQuestion) => item.options[item.correctLetter.charCodeAt(0) - 65];

export async function importWithLegacyRoutes(baseUrl: string, token: string, input: unknown): Promise<ImportResult> {
  const payload = normalize(input);
  const base = baseUrl.replace(/\/$/, '');
  const request = async (path: string, init: RequestInit = {}) => {
    const response = await fetch(`${base}/questionset${path}`, {
      ...init,
      headers: { Authorization: `Bearer ${token}`, ...init.headers },
      cache: 'no-store',
    });
    const text = await response.text();
    let data: Record<string, unknown> = {};
    try { data = JSON.parse(text); } catch { /* The old server can return HTML for missing routes. */ }
    if (!response.ok) throw new Error(typeof data.message === 'string' ? data.message : `Question service returned ${response.status}.`);
    return data;
  };

  const groups = new Map<string, { name: string; items: { question: InputQuestion; index: number }[] }>();
  payload.questions.forEach((question, index) => {
    const key = question.topic.toLocaleLowerCase();
    if (!groups.has(key)) groups.set(key, { name: question.topic, items: [] });
    groups.get(key)!.items.push({ question, index });
  });

  let set: QuestionSet | null = null;
  const publishedIndices: number[] = [];
  const explanationFailures: number[] = [];
  try {
    if (payload.questionSetId) {
      const data = await request(`/${encodeURIComponent(payload.questionSetId)}`);
      set = data.questionSet as QuestionSet;
      if (!set) throw new Error('Subject not found.');
      for (const group of groups.values()) {
        const inactive = set.topics?.find((topic) => topic.name.toLocaleLowerCase() === group.name.toLocaleLowerCase() && !topic.isActive);
        if (inactive) throw new Error(`Topic "${group.name}" is inactive.`);
      }
    }

    for (const group of groups.values()) {
      let added: QuestionSet;
      if (!set) {
        // The deployed backend creates a subject only through its CSV endpoint.
        if (group.items.some(({ question }) => question.options.some((option) => option.includes('|')))) {
          throw new Error('An option contains a vertical bar (|), which the current subject upload format cannot represent. Choose an existing subject or update the backend.');
        }
        const csv = ['type,question,options,correctanswer,points', ...group.items.map(({ question }) => [
          'multiple-choice', csvCell(question.question), csvCell(question.options.join('|')),
          csvCell(answerText(question)), '1',
        ].join(','))].join('\n');
        const form = new FormData();
        form.set('title', payload.title || '');
        form.set('topicName', group.name);
        form.set('file', new Blob([csv], { type: 'text/csv' }), 'questions.csv');
        const data = await request('/bulk-upload', { method: 'POST', body: form });
        added = data.questionSet as QuestionSet;
        if (!added?.id) throw new Error('Subject was created but the server did not return its ID.');
      } else {
        let topic = set.topics?.find((item) => item.name.toLocaleLowerCase() === group.name.toLocaleLowerCase());
        if (!topic) {
          const data = await request(`/${encodeURIComponent(set.id)}/topics`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: group.name }),
          });
          topic = data.topic as Topic;
          if (!topic?.id) throw new Error(`Could not create topic "${group.name}".`);
          set.topics = [...(set.topics || []), topic];
        }
        const data = await request(`/${encodeURIComponent(set.id)}/topics/${encodeURIComponent(topic.id)}/questions`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ questions: group.items.map(({ question }) => ({
            type: 'multiple-choice', question: question.question, options: question.options,
            correctAnswer: answerText(question), points: 1,
          })) }),
        });
        added = data.questionSet as QuestionSet;
      }

      const oldIds = new Set(set?.questions?.map((question) => question.id) || []);
      const newQuestions = (added.questions || []).filter((question) => !oldIds.has(question.id)).sort((a, b) => a.orderNum - b.orderNum);
      set = added;
      publishedIndices.push(...group.items.map((item) => item.index));
      if (newQuestions.length !== group.items.length) {
        explanationFailures.push(...group.items.filter((item) => item.question.explanation).map((item) => item.index + 1));
        continue;
      }
      const patches = group.items.map(({ question, index }, position) => async () => {
        if (!question.explanation) return;
        try {
          await request(`/${encodeURIComponent(set!.id)}/questions/${encodeURIComponent(newQuestions[position].id)}/metadata`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ metadata: { explanation: question.explanation } }),
          });
        } catch { explanationFailures.push(index + 1); }
      });
      for (let offset = 0; offset < patches.length; offset += 5) {
        await Promise.all(patches.slice(offset, offset + 5).map((patch) => patch()));
      }
    }

    if (!set) throw new Error('No questions were uploaded.');
    return {
      id: set.id, title: set.title, count: publishedIndices.length,
      topics: [...groups.values()].map((group) => group.name),
      ...(explanationFailures.length ? { warning: `Questions were uploaded, but explanations could not be saved for question numbers ${explanationFailures.sort((a, b) => a - b).join(', ')}.` } : {}),
    };
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'Question import failed.';
    if (set && publishedIndices.length) throw new LegacyImportError(`${publishedIndices.length} questions were published before the import stopped. ${reason}`, { id: set.id, publishedIndices });
    throw new LegacyImportError(reason);
  }
}

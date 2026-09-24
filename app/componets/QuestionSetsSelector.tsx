'use client';

import { Plus, RefreshCw, Trash2 } from 'lucide-react';

export interface Topic {
  id: string;
  name: string;
  isActive: boolean;
  _count?: { questions: number };
}

export interface TopicSelection {
  topicId: string;
  questionCount: number;
  questionIds: string[];
}

export interface QuestionSet {
  id: string;
  title: string;
  questionCount: number;
  totalPoints: number;
  isActive: boolean;
}

export interface SubjectSelection {
  questionSetId: string | null;
  topicSelections: TopicSelection[];
}

interface Props {
  availableQuestionSets: QuestionSet[];
  selections: SubjectSelection[];
  topicsByQuestionSet: Record<string, Topic[]>;
  onQuestionSetChange: (index: number, questionSetId: string | null) => void;
  onAddTopic: (index: number) => void;
  onTopicChange: (index: number, topicIndex: number, topicId: string) => void;
  onQuestionCountChange: (index: number, topicIndex: number, questionCount: number) => void;
  onRemoveTopic: (index: number, topicIndex: number) => void;
  isLoading: boolean;
  onRefresh: () => void;
  examType: 'multi-subject' | 'single-subject';
}

export default function QuestionSetsSelector({
  availableQuestionSets, selections, topicsByQuestionSet, onQuestionSetChange, onAddTopic,
  onTopicChange, onQuestionCountChange, onRemoveTopic, isLoading, onRefresh, examType,
}: Props) {
  const getSet = (id: string | null) => availableQuestionSets.find((set) => set.id === id) ?? null;
  const selectedElsewhere = (id: string, index: number) => selections.some((selection, itemIndex) => itemIndex !== index && selection.questionSetId === id);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Build from topics</h2>
          <p className="mt-1 text-gray-600">
            {examType === 'single-subject' ? 'Choose a subject and the topic mix for this exam.' : 'Choose four subjects, then compose each subject from its topics.'}
          </p>
        </div>
        <button onClick={onRefresh} disabled={isLoading} className="flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 hover:bg-gray-50 disabled:opacity-50">
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
        Select one or more topics and how many questions to draw from each. Questions are sampled by the server when the exam is created. Subjects without topics are shown as legacy banks and can still be used unchanged.
      </div>

      {isLoading ? <div className="py-10 text-center text-gray-600">Loading subjects…</div> : (
        <div className={`grid gap-6 ${examType === 'single-subject' ? 'max-w-2xl grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
          {selections.map((selection, index) => {
            const selectedSet = getSet(selection.questionSetId);
            const topics = selectedSet ? (topicsByQuestionSet[selectedSet.id] ?? []).filter((topic) => topic.isActive) : [];
            const selectedTopicIds = new Set(selection.topicSelections.map((topic) => topic.topicId));
            return <section key={index} className="rounded-lg border-2 border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-gray-800">{examType === 'single-subject' ? 'Subject' : `Subject ${index + 1}`}</h3>
              <label className="mb-4 block text-sm font-medium text-gray-700">Select subject
                <select value={selection.questionSetId ?? ''} onChange={(event) => onQuestionSetChange(index, event.target.value || null)} className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500">
                  <option value="">-- Select a subject --</option>
                  {availableQuestionSets.filter((set) => set.isActive && !selectedElsewhere(set.id, index)).map((set) => <option key={set.id} value={set.id}>{set.title} ({set.questionCount} questions)</option>)}
                </select>
              </label>

              {selectedSet && topics.length === 0 && <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">This is a legacy subject with no topics yet. Creating this exam will use its current active question pool.</div>}

              {selectedSet && topics.length > 0 && <div className="space-y-3">
                <div className="flex items-center justify-between"><div><p className="font-medium text-gray-800">Topic mix</p><p className="text-xs text-gray-500">Each topic can be selected once.</p></div><button type="button" onClick={() => onAddTopic(index)} disabled={selectedTopicIds.size === topics.length} className="inline-flex items-center rounded-lg border border-blue-200 px-3 py-2 text-sm font-medium text-blue-700 disabled:opacity-50"><Plus className="mr-1 h-4 w-4" /> Add topic</button></div>
                {selection.topicSelections.map((topicSelection, topicIndex) => {
                  const topic = topics.find((item) => item.id === topicSelection.topicId);
                  const maximum = topic?._count?.questions ?? 0;
                  return <div key={`${topicSelection.topicId}-${topicIndex}`} className="grid grid-cols-[1fr_7rem_auto] items-end gap-2 rounded-lg bg-gray-50 p-3">
                    <label className="text-xs font-medium text-gray-600">Topic
                      <select value={topicSelection.topicId} onChange={(event) => onTopicChange(index, topicIndex, event.target.value)} className="mt-1 w-full rounded border border-gray-300 bg-white px-2 py-2 text-sm">
                        <option value="">-- Select topic --</option>
                        {topics.filter((item) => item.id === topicSelection.topicId || !selectedTopicIds.has(item.id)).map((item) => <option key={item.id} value={item.id}>{item.name} ({item._count?.questions ?? 0})</option>)}
                      </select>
                    </label>
                    <label className="text-xs font-medium text-gray-600">Questions
                      <input type="number" min="1" max={maximum || undefined} value={topicSelection.questionCount || ''} onChange={(event) => onQuestionCountChange(index, topicIndex, Number(event.target.value))} className="mt-1 w-full rounded border border-gray-300 bg-white px-2 py-2 text-sm" />
                    </label>
                    <button type="button" onClick={() => onRemoveTopic(index, topicIndex)} className="rounded-lg p-2 text-red-600 hover:bg-red-50" aria-label="Remove topic"><Trash2 className="h-4 w-4" /></button>
                    {topic && <p className="col-span-3 text-xs text-gray-500">Up to {maximum} available question{maximum === 1 ? '' : 's'} from {topic.name}.</p>}
                  </div>;
                })}
                {selection.topicSelections.length === 0 && <p className="rounded-lg border border-dashed border-gray-300 p-4 text-sm text-gray-500">Add at least one topic to build this subject.</p>}
              </div>}
            </section>;
          })}
        </div>
      )}
    </div>
  );
}

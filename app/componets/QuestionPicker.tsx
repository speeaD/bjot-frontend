'use client';

import { useState } from 'react';
import { questionIdsInRange } from '../lib/questionSelection';

export type SelectableQuestion = { id: string; question: string };

export default function QuestionPicker({ label, questions, selectedIds, onChange }: {
  label: string;
  questions: SelectableQuestion[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  const [from, setFrom] = useState('1');
  const [to, setTo] = useState<string | null>(null);
  const [error, setError] = useState('');
  const selected = new Set(selectedIds);

  const selectRange = () => {
    try {
      const ids = questionIdsInRange(questions, from, to ?? String(questions.length));
      onChange(ids);
      setError('');
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Enter a valid question range.'); }
  };

  if (!questions.length) return <p className="text-xs text-gray-500">No active questions in {label}.</p>;

  return <div className="space-y-2">
    <fieldset aria-label={`Select question range for ${label}`} className="rounded border border-gray-200 bg-white p-3">
      <legend className="px-1 text-sm font-medium text-gray-700">Select question range</legend>
      <div className="grid grid-cols-2 gap-3">
        <label className="text-xs font-medium text-gray-600">From
          <input aria-label={`First question for ${label}`} type="number" min={1} max={questions.length} step={1} value={from} onChange={(event) => { setFrom(event.target.value); setError(''); }} className="mt-1 w-full rounded border border-gray-300 px-2 py-2 text-sm" />
        </label>
        <label className="text-xs font-medium text-gray-600">To
          <input aria-label={`Last question for ${label}`} type="number" min={1} max={questions.length} step={1} value={to ?? questions.length} onChange={(event) => { setTo(event.target.value); setError(''); }} className="mt-1 w-full rounded border border-gray-300 px-2 py-2 text-sm" />
        </label>
      </div>
      <p className="mt-2 text-xs text-gray-500">Includes both question numbers and replaces the current selection. You can adjust individual questions below.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={selectRange} className="rounded-lg bg-blue-700 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-800">Select range</button>
        <button type="button" onClick={() => { onChange(questions.map((question) => question.id)); setError(''); }} className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50">Select all</button>
        <button type="button" onClick={() => { onChange([]); setError(''); }} className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50">Clear selection</button>
      </div>
      {error && <p role="alert" className="mt-2 text-xs text-red-700">{error}</p>}
    </fieldset>
    <details className="rounded border border-gray-200 bg-white p-3">
      <summary className="cursor-pointer text-sm font-medium text-blue-700">Choose questions ({selectedIds.length} selected)</summary>
      <div className="mt-3 max-h-64 space-y-2 overflow-y-auto">{questions.map((question, index) => <label key={question.id} className="flex gap-2 rounded border border-gray-100 p-2 text-sm">
        <input type="checkbox" checked={selected.has(question.id)} onChange={() => onChange(selected.has(question.id) ? selectedIds.filter((id) => id !== question.id) : [...selectedIds, question.id])} />
        <span>{index + 1}. {question.question}</span>
      </label>)}</div>
    </details>
  </div>;
}

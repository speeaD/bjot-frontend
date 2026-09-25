import test from 'node:test';
import assert from 'node:assert/strict';
import { adminApi } from '../app/lib/api/attendance-client.ts';

test('save returns the persisted schedule for immediate display without another read', async (t) => {
  const schedule = { _id: 'saved-id', department: 'Sciences', weeklySchedule: [{ _id: 'class-id', questionSetTitle: 'Physics' }] };
  const request = t.mock.method(globalThis, 'fetch', async () => Response.json({ success: true, data: schedule }));
  assert.deepEqual(await adminApi.createOrUpdateSchedule({ department: 'Sciences', weeklySchedule: [] }), schedule);
  assert.equal(request.mock.callCount(), 1);
  assert.equal(request.mock.calls[0].arguments[1].method, 'POST');
});

test('explicit refresh returns all departments, including an empty schedule list', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => Response.json({ success: true, data: [] }));
  assert.deepEqual(await adminApi.getAllSchedules(), []);
});

test('refresh failures remain errors instead of clearing the current schedules', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => Response.json({ message: 'Please sign in again' }, { status: 401 }));
  await assert.rejects(adminApi.getAllSchedules(), /Please sign in again/);
});

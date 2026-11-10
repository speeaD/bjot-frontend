import test from 'node:test';
import assert from 'node:assert/strict';
import { expiryDate, jambPracticeAccess, matchesPlanFilter, membershipChoice, membershipLabels, membershipPayload } from '../app/lib/admin-memberships.ts';
const future = '2099-03-31T23:00:00.000Z';
const premium = { accountType: 'premium', isActive: true, subscriptionLevel: 'pro', subscriptionExpiresAt: future };

test('admin badges and filters distinguish Pro, Pro Max, Lite, legacy premium and expired plans', () => {
  assert.equal(membershipLabels[membershipChoice(premium)], 'Pro');
  assert.equal(membershipLabels[membershipChoice({ ...premium, subscriptionLevel: 'pro-max' })], 'Pro Max');
  assert(matchesPlanFilter(premium, 'pro'));
  assert(!matchesPlanFilter(premium, 'pro-max'));
  assert(matchesPlanFilter({ ...premium, subscriptionExpiresAt: '2000-01-01T00:00:00Z' }, 'expired'));
  assert.equal(membershipChoice({ ...premium, subscriptionLevel: null }), 'legacy');
  assert.equal(membershipChoice({ ...premium, accountType: 'regular' }), 'regular');
});

test('JAMB access follows active Pro membership, expiry and account status', () => {
  assert(jambPracticeAccess(premium));
  assert(jambPracticeAccess({ ...premium, subscriptionLevel: 'pro-max' }));
  for (const changed of [{ subscriptionLevel: 'lite' }, { subscriptionLevel: null }, { accountType: 'regular' }, { isActive: false }, { subscriptionExpiresAt: '2000-01-01T00:00:00Z' }]) {
    assert.equal(jambPracticeAccess({ ...premium, ...changed }), false);
  }
});

test('expiry dates represent inclusive Lagos access days and resaving retains the exact paid expiry', () => {
  assert.equal(expiryDate(future), '2099-03-31');
  assert.equal(membershipPayload('pro-max', '2099-03-31').subscriptionExpiresAt, future);
  const exact = '2099-02-10T10:15:00.000Z';
  assert.equal(membershipPayload('pro', '2099-02-10', { ...premium, subscriptionExpiresAt: exact }).subscriptionExpiresAt, exact);
  assert.throws(() => membershipPayload('pro', ''), /expiry/);
  assert.deepEqual(membershipPayload('legacy', ''), { accountType: 'premium', subscriptionLevel: null, subscriptionExpiresAt: null });
  assert.deepEqual(membershipPayload('regular', ''), { accountType: 'regular' });
});

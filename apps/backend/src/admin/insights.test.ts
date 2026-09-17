import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fillDays, lagosDay } from './insights.js';

test('reporting rolls over at midnight in Lagos rather than UTC', () => {
  assert.equal(lagosDay(new Date('2026-09-17T23:30:00Z')), '2026-09-18');
  assert.equal(lagosDay(new Date('2026-09-17T22:59:59Z')), '2026-09-17');
});
test('reporting includes empty days and preserves recorded counts across month boundaries', () => {
  const series = fillDays(7, new Date('2026-10-02T12:00:00Z'), [
    { day: '2026-09-30', enquiries: 4, confirmed: 2, ready: 1 },
  ]);
  assert.equal(series.length, 7);
  assert.equal(series[0].day, '2026-09-26');
  assert.equal(series[6].day, '2026-10-02');
  assert.deepEqual(series[4], { day: '2026-09-30', enquiries: 4, confirmed: 2, ready: 1 });
  assert.equal(series[5].enquiries, 0);
});
test('30-day reporting omits rows outside its window', () => {
  const series = fillDays(30, new Date('2026-09-17T12:00:00Z'), [
    { day: '2020-01-01', enquiries: 100, confirmed: 100, ready: 100 },
  ]);
  assert.equal(series.length, 30);
  assert.equal(
    series.reduce((sum, row) => sum + row.enquiries, 0),
    0
  );
});

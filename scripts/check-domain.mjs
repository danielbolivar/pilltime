import {
  ALL_DAYS,
  doseLogKey,
  getDurationEndDate,
  getTodayDoses,
  isPillActiveOnDate,
} from '../src/domain/schedule.ts';

const basePill = {
  id: 'p1',
  name: 'Vitamin D',
  times: [{ hour: 9, minute: 0 }],
  daysOfWeek: [...ALL_DAYS],
  duration: { type: 'keep' },
  reminderOffsetsMinutes: [-5, 0],
  notificationIds: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const thursday = '2026-08-06';
if (!isPillActiveOnDate(basePill, thursday)) {
  throw new Error('keep pill should be active on Thursday');
}

const weekendOnly = { ...basePill, daysOfWeek: [0, 6] };
if (isPillActiveOnDate(weekendOnly, thursday)) {
  throw new Error('weekend pill should not be active on Thursday');
}

const finite = {
  ...basePill,
  duration: { type: 'days', days: 3, startDate: '2026-08-06' },
};
if (getDurationEndDate(finite.duration) !== '2026-08-08') {
  throw new Error('finite end date wrong');
}
if (isPillActiveOnDate(finite, '2026-08-09')) {
  throw new Error('finite pill should end');
}

const key = doseLogKey('p1', thursday, '09:00');
const doses = getTodayDoses(
  [basePill],
  {
    [key]: {
      key,
      pillId: 'p1',
      date: thursday,
      time: '09:00',
      status: 'taken',
      updatedAt: new Date().toISOString(),
    },
  },
  new Date(2026, 7, 6, 12, 0, 0),
);

if (doses.length !== 1 || doses[0].status !== 'taken') {
  throw new Error('today doses status wrong');
}

console.log('domain schedule checks passed');

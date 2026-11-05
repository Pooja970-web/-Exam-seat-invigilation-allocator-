const { buildPlan } = require('./allocator');
const subs = ['MATH', 'PHY', 'CHEM'];
const students = Array.from({ length: 60 }, (_, i) => ({ id: 'S' + (i + 1), name: 'N' + i, branch: 'CS', subjects: [subs[i % 3]] }));
const teachers = Array.from({ length: 12 }, (_, i) => ({ name: 'T' + i, subject: subs[i % 3] }));
const r = buildPlan({ rooms: [{ name: 'R1', rows: 5, cols: 6 }, { name: 'R2', rows: 5, cols: 6 }],
  students, teachers, exams: subs.map(s => ({ subject: s, date: '2026-12-01', time: '10:00' })), perRoom: 2, maxDuties: 3 });
console.log(r.summary);
if (r.summary.seatingViolations !== 0) { console.error('FAIL'); process.exit(1); }
console.log('PASS');

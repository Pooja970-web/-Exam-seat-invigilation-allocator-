// Constraint-based allocation engine
// Seating constraints : room capacity, no same-subject neighbour (left/front)
// Invigilation constraints: N per room, no double-booking in a slot,
//   own-subject invigilation avoided where possible (soft), max duties per teacher, fair load balancing

function seatSlot(students, rooms, tries = 300) {
  let best = null;
  for (let i = 0; i < tries; i++) {
    const res = seatOnce(students, rooms, i === 0 ? 0 : 1.5);
    if (!best || res.violations < best.violations) best = res;
    if (best.violations === 0) break;
  }
  return best;
}

function seatOnce(students, rooms, noise) {
  const need = students.length;
  const chosen = []; let cap = 0;
  for (const r of [...rooms].sort((a, b) => b.rows * b.cols - a.rows * a.cols)) {
    if (cap >= need) break;
    chosen.push(r); cap += r.rows * r.cols;
  }
  if (cap < need) throw new Error(`Capacity ${cap} < students ${need}`);

  const groups = {};
  students.forEach(s => (groups[s.subject] ||= []).push(s));
  const plan = []; let violations = 0;

  for (const room of chosen) {
    const grid = Array.from({ length: room.rows }, () => Array(room.cols).fill(null));
    for (let r = 0; r < room.rows; r++) for (let c = 0; c < room.cols; c++) {
      const keys = Object.keys(groups).filter(k => groups[k].length);
      if (!keys.length) break;
      const avoid = new Set();
      [[r, c - 1], [r - 1, c]].forEach(([y, x]) => {
        if (grid[y]?.[x]) avoid.add(grid[y][x].subject);
      });
      // heuristic: pick the subject with most students left that doesn't clash
      keys.sort((a, b) => (groups[b].length - groups[a].length) + (Math.random() - 0.5) * noise * 2);
      let pick = keys.find(k => !avoid.has(k));
      if (!pick) { pick = keys[0]; violations++; }
      grid[r][c] = groups[pick].shift();
    }
    if (grid.flat().some(Boolean)) plan.push({ room, grid });
  }
  return { plan, violations };
}

function buildPlan({ rooms, students, teachers, exams, perRoom = 2, maxDuties = 5 }) {
  const slotMap = {};
  exams.forEach(e => (slotMap[`${e.date} ${e.time}`] ||= []).push(e.subject));
  const load = Object.fromEntries(teachers.map(t => [t.name, 0]));
  const slots = []; let violations = 0, duties = 0, conflicts = 0;

  for (const [key, subjects] of Object.entries(slotMap)) {
    const sts = students
      .map(s => ({ ...s, subject: s.subjects.find(x => subjects.includes(x)) }))
      .filter(s => s.subject);
    if (!sts.length) continue;
    const { plan, violations: v } = seatSlot(sts, rooms);
    violations += v;
    const busy = new Set();
    for (const p of plan) {
      const subs = new Set(p.grid.flat().filter(Boolean).map(s => s.subject));
      p.invigilators = [];
      for (let i = 0; i < perRoom; i++) {
        const cand = teachers
          .filter(t => !busy.has(t.name) && load[t.name] < maxDuties)
          .sort((a, b) => (subs.has(a.subject) - subs.has(b.subject)) || (load[a.name] - load[b.name]));
        if (!cand.length) throw new Error(`No teacher available for ${p.room.name} in slot ${key}. Add teachers or raise max duties.`);
        if (subs.has(cand[0].subject)) conflicts++;
        busy.add(cand[0].name); load[cand[0].name]++; duties++;
        p.invigilators.push(cand[0].name);
      }
    }
    slots.push({ key, subjects, plan });
  }
  const loads = Object.values(load);
  return { slots, load, summary: { slots: slots.length, seatingViolations: violations,
    totalDuties: duties, ownSubjectDuties: conflicts, maxLoad: Math.max(...loads), minLoad: Math.min(...loads) } };
}

module.exports = { buildPlan, seatSlot };

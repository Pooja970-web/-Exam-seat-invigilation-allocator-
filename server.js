const express = require('express');
const PDFDocument = require('pdfkit');
const { buildPlan } = require('./allocator');

const app = express();
app.use(express.json({ limit: '2mb' }));
app.use(express.static('public'));
const store = new Map();

app.post('/api/generate', (req, res) => {
  try {
    const result = buildPlan(req.body);
    const id = Date.now().toString(36);
    store.set(id, result);
    res.json({ id, ...result });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.get('/api/pdf/seating/:id', (req, res) => {
  const r = store.get(req.params.id); if (!r) return res.sendStatus(404);
  const doc = new PDFDocument({ margin: 36, size: 'A4' });
  res.type('pdf').attachment('seating-plan.pdf'); doc.pipe(res);
  let first = true;
  for (const s of r.slots) for (const p of s.plan) {
    if (!first) doc.addPage(); first = false;
    doc.fontSize(16).text(`${p.room.name} - ${s.key}`);
    doc.fontSize(9).fillColor('#555').text(`Subjects: ${s.subjects.join(', ')} | Invigilators: ${p.invigilators.join(', ')}`).fillColor('#000').moveDown();
    const w = Math.min(90, 520 / p.room.cols), h = 40, x0 = 36, y0 = doc.y;
    p.grid.forEach((row, i) => row.forEach((st, j) => {
      const x = x0 + j * w, y = y0 + i * h;
      doc.rect(x, y, w, h).stroke('#999');
      if (st) doc.fontSize(8).text(`${st.id}\n${st.subject}`, x + 3, y + 8, { width: w - 6, align: 'center' });
    }));
  }
  doc.end();
});

app.get('/api/pdf/roster/:id', (req, res) => {
  const r = store.get(req.params.id); if (!r) return res.sendStatus(404);
  const doc = new PDFDocument({ margin: 36, size: 'A4' });
  res.type('pdf').attachment('duty-roster.pdf'); doc.pipe(res);
  doc.fontSize(18).text('Invigilation Duty Roster').moveDown();
  for (const s of r.slots) {
    doc.fontSize(12).fillColor('#000').text(`${s.key}  (${s.subjects.join(', ')})`, { underline: true });
    s.plan.forEach(p => doc.fontSize(10).text(`   ${p.room.name}: ${p.invigilators.join(', ')}`));
    doc.moveDown(0.6);
    if (doc.y > 750) doc.addPage();
  }
  doc.addPage().fontSize(14).text('Duty load per teacher').moveDown(0.5);
  Object.entries(r.load).forEach(([n, c]) => doc.fontSize(10).text(`${n}: ${c} duties`));
  doc.end();
});

app.listen(process.env.PORT || 3000, () => console.log('Running on http://localhost:3000'));

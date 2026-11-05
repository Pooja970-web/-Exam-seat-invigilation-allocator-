# Exam Seat & Invigilation Allocator
Auto-generates seating plans and invigilator duty rosters (PDF) using a constraint-based algorithm.

## Run
    npm install && npm start      # http://localhost:3000
    npm test

## Constraints
**Seating:** room capacity; no same-subject student at left/front seats (greedy most-remaining-subject-first heuristic + randomized restarts, violations reported).
**Invigilation:** N per room; no teacher double-booked in a slot; own-subject invigilation avoided where possible (soft constraint, count reported); max duties cap; least-loaded-first for fairness.

## Stack
Node.js, Express, PDFKit, vanilla JS frontend. Free deploy: Render / Railway.

## Ideas to extend
SQLite/Postgres persistence, auth for admins, CSV upload, branch-mixing constraint, backtracking/OR-Tools solver, Docker + GitHub Actions CI.

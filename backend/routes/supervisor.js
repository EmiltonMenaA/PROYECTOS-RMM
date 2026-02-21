const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const isAllowedRole = (role) => role === 'supervisor' || role === 'admin';

router.get('/calendar', requireAuth, async (req, res) => {
  if (!isAllowedRole(req.user?.role)) return res.status(403).json({ error: 'Supervisor role required' });

  const { start, end } = req.query;
  if (!start || !end) return res.status(400).json({ error: 'start and end are required' });

  try {
    const events = await db.query(
      'SELECT id, title, project, category, start_date, end_date, status FROM supervisor_events WHERE user_id = $1 AND start_date <= $2 AND end_date >= $3 ORDER BY start_date ASC',
      [req.user.id, end, start]
    );
    const tasks = await db.query(
      'SELECT id, title, due_date, status, priority FROM supervisor_tasks WHERE user_id = $1 ORDER BY due_date ASC NULLS LAST',
      [req.user.id]
    );
    const actions = await db.query(
      'SELECT id, label, action_type FROM supervisor_actions WHERE user_id = $1 ORDER BY created_at ASC',
      [req.user.id]
    );

    res.json({ events: events.rows, tasks: tasks.rows, actions: actions.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load calendar data' });
  }
});

router.post('/events', requireAuth, async (req, res) => {
  if (!isAllowedRole(req.user?.role)) return res.status(403).json({ error: 'Supervisor role required' });
  const { title, project, category, start_date, end_date, status } = req.body;
  if (!title || !start_date || !end_date) return res.status(400).json({ error: 'title, start_date, end_date required' });

  try {
    const result = await db.query(
      'INSERT INTO supervisor_events (user_id, title, project, category, start_date, end_date, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, title, project, category, start_date, end_date, status',
      [req.user.id, title, project || null, category || null, start_date, end_date, status || 'scheduled']
    );
    res.status(201).json({ event: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not create event' });
  }
});

router.post('/tasks', requireAuth, async (req, res) => {
  if (!isAllowedRole(req.user?.role)) return res.status(403).json({ error: 'Supervisor role required' });
  const { title, due_date, priority, status } = req.body;
  if (!title) return res.status(400).json({ error: 'title required' });

  try {
    const result = await db.query(
      'INSERT INTO supervisor_tasks (user_id, title, due_date, priority, status) VALUES ($1, $2, $3, $4, $5) RETURNING id, title, due_date, priority, status',
      [req.user.id, title, due_date || null, priority || null, status || 'pending']
    );
    res.status(201).json({ task: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not create task' });
  }
});

router.post('/actions', requireAuth, async (req, res) => {
  if (!isAllowedRole(req.user?.role)) return res.status(403).json({ error: 'Supervisor role required' });
  const { label, action_type } = req.body;
  if (!label || !action_type) return res.status(400).json({ error: 'label and action_type required' });

  try {
    const result = await db.query(
      'INSERT INTO supervisor_actions (user_id, label, action_type) VALUES ($1, $2, $3) RETURNING id, label, action_type',
      [req.user.id, label, action_type]
    );
    res.status(201).json({ action: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not create action' });
  }
});

module.exports = router;

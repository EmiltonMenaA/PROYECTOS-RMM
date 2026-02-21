const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// List projects with supervisor info
router.get('/', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        p.id, 
        p.name, 
        p.status, 
        p.location, 
        p.description,
        p.contract_value,
        p.start_date,
        p.end_date,
        ARRAY_AGG(
          json_build_object(
            'id', ps.user_id,
            'name', u.full_name,
            'specialty', u.department,
            'email', u.email
          )
        ) FILTER (WHERE ps.user_id IS NOT NULL) as supervisors
      FROM projects p
      LEFT JOIN project_supervisors ps ON p.id = ps.project_id
      LEFT JOIN users u ON ps.user_id = u.id
      GROUP BY p.id, p.name, p.status, p.location, p.description, p.contract_value, p.start_date, p.end_date
      ORDER BY p.created_at DESC
      LIMIT 100
    `);
    res.json({ projects: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch projects' });
  }
});

// Get single project with supervisors
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(`
      SELECT 
        p.id, 
        p.name, 
        p.status, 
        p.location, 
        p.description,
        p.contract_value,
        p.start_date,
        p.end_date,
        ARRAY_AGG(
          json_build_object(
            'id', ps.user_id,
            'name', u.full_name,
            'specialty', u.department,
            'email', u.email
          )
        ) FILTER (WHERE ps.user_id IS NOT NULL) as supervisors
      FROM projects p
      LEFT JOIN project_supervisors ps ON p.id = ps.project_id
      LEFT JOIN users u ON ps.user_id = u.id
      WHERE p.id = $1
      GROUP BY p.id, p.name, p.status, p.location, p.description, p.contract_value, p.start_date, p.end_date
    `, [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Project not found' });
    res.json({ project: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch project' });
  }
});

// Create project
router.post('/', requireAuth, async (req, res) => {
  const { name, location, description, status, contract_value, start_date, end_date } = req.body;
  try {
    const result = await db.query(
      `INSERT INTO projects (name, location, description, status, contract_value, start_date, end_date) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING id, name, location, description, status, contract_value, start_date, end_date`,
      [name, location, description || null, status || 'planning', contract_value || null, start_date || null, end_date || null]
    );
    res.status(201).json({ project: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not create project' });
  }
});

// Assign supervisor to project
router.post('/:projectId/supervisors/:supervisorId', requireAuth, async (req, res) => {
  try {
    const { projectId, supervisorId } = req.params;
    
    // Check if already assigned
    const check = await db.query(
      'SELECT * FROM project_supervisors WHERE project_id = $1 AND user_id = $2',
      [projectId, supervisorId]
    );
    if (check.rowCount > 0) {
      return res.status(409).json({ error: 'Supervisor already assigned' });
    }

    // Assign supervisor
    await db.query(
      'INSERT INTO project_supervisors (project_id, user_id) VALUES ($1, $2)',
      [projectId, supervisorId]
    );

    // Get updated project
    const result = await db.query(`
      SELECT 
        p.id, 
        p.name, 
        p.status, 
        p.location, 
        p.description,
        p.contract_value,
        p.start_date,
        p.end_date,
        ARRAY_AGG(
          json_build_object(
            'id', ps.user_id,
            'name', u.full_name,
            'specialty', u.department,
            'email', u.email
          )
        ) FILTER (WHERE ps.user_id IS NOT NULL) as supervisors
      FROM projects p
      LEFT JOIN project_supervisors ps ON p.id = ps.project_id
      LEFT JOIN users u ON ps.user_id = u.id
      WHERE p.id = $1
      GROUP BY p.id, p.name, p.status, p.location, p.description, p.contract_value, p.start_date, p.end_date
    `, [projectId]);

    res.json({ message: 'Supervisor assigned', project: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not assign supervisor' });
  }
});

// Remove supervisor from project
router.delete('/:projectId/supervisors/:supervisorId', requireAuth, async (req, res) => {
  try {
    const { projectId, supervisorId } = req.params;
    
    await db.query(
      'DELETE FROM project_supervisors WHERE project_id = $1 AND user_id = $2',
      [projectId, supervisorId]
    );

    // Get updated project
    const result = await db.query(`
      SELECT 
        p.id, 
        p.name, 
        p.status, 
        p.location, 
        p.description,
        p.contract_value,
        p.start_date,
        p.end_date,
        ARRAY_AGG(
          json_build_object(
            'id', ps.user_id,
            'name', u.full_name,
            'specialty', u.department,
            'email', u.email
          )
        ) FILTER (WHERE ps.user_id IS NOT NULL) as supervisors
      FROM projects p
      LEFT JOIN project_supervisors ps ON p.id = ps.project_id
      LEFT JOIN users u ON ps.user_id = u.id
      WHERE p.id = $1
      GROUP BY p.id, p.name, p.status, p.location, p.description, p.contract_value, p.start_date, p.end_date
    `, [projectId]);

    res.json({ message: 'Supervisor removed', project: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not remove supervisor' });
  }
});

module.exports = router;

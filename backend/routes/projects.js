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
        p.city,
        p.status, 
        p.location, 
        p.description,
        p.contract_value,
        p.start_date,
        p.end_date,
        COALESCE(MAX(r.total_reports), 0) AS total_reports,
        COALESCE(MAX(r.completed_reports), 0) AS completed_reports,
        COALESCE(MAX(r.reviewed_reports), 0) AS reviewed_reports,
        CASE
          WHEN COALESCE(MAX(r.total_reports), 0) = 0 THEN
            CASE
              WHEN p.status = 'completed' THEN 100
              WHEN p.status = 'in-progress' THEN 65
              ELSE 25
            END
          ELSE LEAST(
            100,
            ROUND(
              ((COALESCE(MAX(r.completed_reports), 0) + COALESCE(MAX(r.reviewed_reports), 0))::numeric / NULLIF(MAX(r.total_reports), 0)::numeric) * 100
            )
          )
        END AS progress_percent,
        ARRAY_AGG(
          json_build_object(
            'id', ps.user_id,
            'name', u.full_name,
            'specialty', u.department,
            'email', u.email
          )
        ) FILTER (WHERE ps.user_id IS NOT NULL) as supervisors
      FROM projects p
      LEFT JOIN (
        SELECT
          project_id,
          COUNT(*)::int AS total_reports,
          COUNT(*) FILTER (WHERE status IN ('completed', 'reviewed'))::int AS completed_reports,
          COUNT(*) FILTER (WHERE status = 'reviewed')::int AS reviewed_reports
        FROM reports
        GROUP BY project_id
      ) r ON r.project_id = p.id
      LEFT JOIN project_supervisors ps ON p.id = ps.project_id
      LEFT JOIN users u ON ps.user_id = u.id
      GROUP BY p.id, p.name, p.city, p.status, p.location, p.description, p.contract_value, p.start_date, p.end_date
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
    const result = await db.query(
      `
      SELECT 
        p.id, 
        p.name, 
        p.city,
        p.status, 
        p.location, 
        p.description,
        p.contract_value,
        p.start_date,
        p.end_date,
        COALESCE(MAX(r.total_reports), 0) AS total_reports,
        COALESCE(MAX(r.completed_reports), 0) AS completed_reports,
        COALESCE(MAX(r.reviewed_reports), 0) AS reviewed_reports,
        CASE
          WHEN COALESCE(MAX(r.total_reports), 0) = 0 THEN
            CASE
              WHEN p.status = 'completed' THEN 100
              WHEN p.status = 'in-progress' THEN 65
              ELSE 25
            END
          ELSE LEAST(
            100,
            ROUND(
              ((COALESCE(MAX(r.completed_reports), 0) + COALESCE(MAX(r.reviewed_reports), 0))::numeric / NULLIF(MAX(r.total_reports), 0)::numeric) * 100
            )
          )
        END AS progress_percent,
        ARRAY_AGG(
          json_build_object(
            'id', ps.user_id,
            'name', u.full_name,
            'specialty', u.department,
            'email', u.email
          )
        ) FILTER (WHERE ps.user_id IS NOT NULL) as supervisors
      FROM projects p
      LEFT JOIN (
        SELECT
          project_id,
          COUNT(*)::int AS total_reports,
          COUNT(*) FILTER (WHERE status IN ('completed', 'reviewed'))::int AS completed_reports,
          COUNT(*) FILTER (WHERE status = 'reviewed')::int AS reviewed_reports
        FROM reports
        GROUP BY project_id
      ) r ON r.project_id = p.id
      LEFT JOIN project_supervisors ps ON p.id = ps.project_id
      LEFT JOIN users u ON ps.user_id = u.id
      WHERE p.id = $1
      GROUP BY p.id, p.name, p.city, p.status, p.location, p.description, p.contract_value, p.start_date, p.end_date
    `,
      [id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json({ project: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch project' });
  }
});

// Create project
router.post('/', requireAuth, async (req, res) => {
  const { name, city, location, description, status, contract_value, start_date, end_date } = req.body;
  try {
    const result = await db.query(
      `INSERT INTO projects (name, city, location, description, status, contract_value, start_date, end_date) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
      RETURNING id, name, city, location, description, status, contract_value, start_date, end_date`,
      [
        name,
        city || null,
        location || null,
        description || null,
        status || 'planning',
        contract_value || null,
        start_date || null,
        end_date || null
      ]
    );
    res.status(201).json({ project: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not create project' });
  }
});

// Update project
router.patch('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { name, city, location, description, status, contract_value, start_date, end_date } = req.body;

  try {
    const existing = await db.query('SELECT id FROM projects WHERE id = $1 LIMIT 1', [id]);
    if (existing.rowCount === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const result = await db.query(
      `
        UPDATE projects
        SET
          name = COALESCE($1, name),
          city = COALESCE($2, city),
          location = COALESCE($3, location),
          description = COALESCE($4, description),
          status = COALESCE($5, status),
          contract_value = COALESCE($6, contract_value),
          start_date = COALESCE($7, start_date),
          end_date = COALESCE($8, end_date)
        WHERE id = $9
        RETURNING id, name, city, status, location, description, contract_value, start_date, end_date
      `,
      [
        name ?? null,
        city ?? null,
        location ?? null,
        description ?? null,
        status ?? null,
        contract_value ?? null,
        start_date ?? null,
        end_date ?? null,
        id
      ]
    );

    res.json({ message: 'Project updated', project: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not update project' });
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
    await db.query('INSERT INTO project_supervisors (project_id, user_id) VALUES ($1, $2)', [
      projectId,
      supervisorId
    ]);

    // Get updated project
    const result = await db.query(
      `
      SELECT 
        p.id, 
        p.name, 
        p.city,
        p.status, 
        p.location, 
        p.description,
        p.contract_value,
        p.start_date,
        p.end_date,
        COALESCE(MAX(r.total_reports), 0) AS total_reports,
        COALESCE(MAX(r.completed_reports), 0) AS completed_reports,
        COALESCE(MAX(r.reviewed_reports), 0) AS reviewed_reports,
        CASE
          WHEN COALESCE(MAX(r.total_reports), 0) = 0 THEN
            CASE
              WHEN p.status = 'completed' THEN 100
              WHEN p.status = 'in-progress' THEN 65
              ELSE 25
            END
          ELSE LEAST(
            100,
            ROUND(
              ((COALESCE(MAX(r.completed_reports), 0) + COALESCE(MAX(r.reviewed_reports), 0))::numeric / NULLIF(MAX(r.total_reports), 0)::numeric) * 100
            )
          )
        END AS progress_percent,
        ARRAY_AGG(
          json_build_object(
            'id', ps.user_id,
            'name', u.full_name,
            'specialty', u.department,
            'email', u.email
          )
        ) FILTER (WHERE ps.user_id IS NOT NULL) as supervisors
      FROM projects p
      LEFT JOIN (
        SELECT
          project_id,
          COUNT(*)::int AS total_reports,
          COUNT(*) FILTER (WHERE status IN ('completed', 'reviewed'))::int AS completed_reports,
          COUNT(*) FILTER (WHERE status = 'reviewed')::int AS reviewed_reports
        FROM reports
        GROUP BY project_id
      ) r ON r.project_id = p.id
      LEFT JOIN project_supervisors ps ON p.id = ps.project_id
      LEFT JOIN users u ON ps.user_id = u.id
      WHERE p.id = $1
      GROUP BY p.id, p.name, p.city, p.status, p.location, p.description, p.contract_value, p.start_date, p.end_date
    `,
      [projectId]
    );

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

    await db.query('DELETE FROM project_supervisors WHERE project_id = $1 AND user_id = $2', [
      projectId,
      supervisorId
    ]);

    // Get updated project
    const result = await db.query(
      `
      SELECT 
        p.id, 
        p.name, 
        p.city,
        p.status, 
        p.location, 
        p.description,
        p.contract_value,
        p.start_date,
        p.end_date,
        COALESCE(MAX(r.total_reports), 0) AS total_reports,
        COALESCE(MAX(r.completed_reports), 0) AS completed_reports,
        COALESCE(MAX(r.reviewed_reports), 0) AS reviewed_reports,
        CASE
          WHEN COALESCE(MAX(r.total_reports), 0) = 0 THEN
            CASE
              WHEN p.status = 'completed' THEN 100
              WHEN p.status = 'in-progress' THEN 65
              ELSE 25
            END
          ELSE LEAST(
            100,
            ROUND(
              ((COALESCE(MAX(r.completed_reports), 0) + COALESCE(MAX(r.reviewed_reports), 0))::numeric / NULLIF(MAX(r.total_reports), 0)::numeric) * 100
            )
          )
        END AS progress_percent,
        ARRAY_AGG(
          json_build_object(
            'id', ps.user_id,
            'name', u.full_name,
            'specialty', u.department,
            'email', u.email
          )
        ) FILTER (WHERE ps.user_id IS NOT NULL) as supervisors
      FROM projects p
      LEFT JOIN (
        SELECT
          project_id,
          COUNT(*)::int AS total_reports,
          COUNT(*) FILTER (WHERE status IN ('completed', 'reviewed'))::int AS completed_reports,
          COUNT(*) FILTER (WHERE status = 'reviewed')::int AS reviewed_reports
        FROM reports
        GROUP BY project_id
      ) r ON r.project_id = p.id
      LEFT JOIN project_supervisors ps ON p.id = ps.project_id
      LEFT JOIN users u ON ps.user_id = u.id
      WHERE p.id = $1
      GROUP BY p.id, p.name, p.city, p.status, p.location, p.description, p.contract_value, p.start_date, p.end_date
    `,
      [projectId]
    );

    res.json({ message: 'Supervisor removed', project: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not remove supervisor' });
  }
});

module.exports = router;

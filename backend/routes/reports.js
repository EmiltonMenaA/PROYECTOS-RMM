const express = require('express');
const multer = require('multer');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const upload = multer({ dest: 'uploads/' });
const router = express.Router();

// List reports with project and supervisor info
router.get('/', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        r.id, 
        r.project_id, 
        r.author_id, 
        r.summary, 
        r.details,
        r.created_at,
        r.updated_at,
        r.status,
        p.name as project_name,
        u.full_name as supervisor_name,
        COALESCE(COUNT(e.id), 0) as photo_count
      FROM reports r
      LEFT JOIN projects p ON r.project_id = p.id
      LEFT JOIN users u ON r.author_id = u.id
      LEFT JOIN evidence_files e ON r.id = e.report_id
      GROUP BY r.id, p.id, u.id
      ORDER BY r.created_at DESC
      LIMIT 100
    `);

    // Rename summary to description for frontend compatibility
    const formattedReports = result.rows.map(report => ({
      id: report.id,
      project_id: report.project_id,
      author_id: report.author_id,
      project_name: report.project_name,
      supervisor_name: report.supervisor_name,
      description: report.summary || report.details || '',
      created_at: report.created_at,
      updated_at: report.updated_at,
      status: report.status || 'pending',
      photo_count: parseInt(report.photo_count) || 0
    }));

    res.json({ reports: formattedReports });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch reports' });
  }
});

// Submit report with optional photos (protected)
const storage = require('../storage');
const { retry } = require('../utils/retry');
const logger = require('../utils/logger');
const notifications = require('../utils/notifications');

const reportUpload = upload.fields([
  { name: 'photos', maxCount: 30 },
  { name: 'attachments', maxCount: 30 }
]);

function runReportUpload(req, res) {
  return new Promise((resolve, reject) => {
    reportUpload(req, res, err => {
      if (err) {
        return reject(err);
      }
      resolve();
    });
  });
}

// Robust submit: use DB transaction and retries for uploads
router.post('/', requireAuth, async (req, res) => {
  try {
    await runReportUpload(req, res);
  } catch (err) {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: `Upload inválido: ${err.message}` });
    }
    return res.status(400).json({ error: err.message || 'No se pudieron procesar los archivos' });
  }

  const { project_id, summary, details } = req.body;
  const author_id = req.user && req.user.id;

  if (!author_id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!['supervisor', 'admin'].includes(req.user?.role)) {
    return res.status(403).json({ error: 'Supervisor role required' });
  }

  if (!project_id) {
    return res.status(400).json({ error: 'project_id is required' });
  }

  let client;
  try {
    client = await db.pool.connect();
    const assignment = await client.query(
      'SELECT 1 FROM project_supervisors WHERE project_id = $1 AND user_id = $2 LIMIT 1',
      [project_id, author_id]
    );

    // Admin can submit reports for any project; supervisors only for assigned projects.
    if (req.user.role !== 'admin' && assignment.rowCount === 0) {
      return res.status(403).json({ error: 'Project not assigned to this supervisor' });
    }

    await client.query('BEGIN');
    const result = await client.query(
      'INSERT INTO reports (project_id, author_id, summary, details) VALUES ($1, $2, $3, $4) RETURNING id, project_id, author_id, summary, details, created_at',
      [project_id, author_id, summary || null, details || null]
    );
    const report = result.rows[0];

    const incomingFiles = [
      ...(Array.isArray(req.files?.photos) ? req.files.photos : []),
      ...(Array.isArray(req.files?.attachments) ? req.files.attachments : [])
    ];

    const savedFiles = [];
    if (incomingFiles.length) {
      for (const file of incomingFiles) {
        try {
          // retry uploads up to 3 times with backoff
          const uploaded = await retry(() => storage.upload(file), 3, 500);
          const insert = await client.query(
            'INSERT INTO evidence_files (report_id, filename, filepath, url, uploaded_by) VALUES ($1, $2, $3, $4, $5) RETURNING id, filename, filepath, url, uploaded_at',
            [
              report.id,
              uploaded.filename,
              uploaded.key || null,
              uploaded.url || null,
              author_id || null
            ]
          );
          savedFiles.push(insert.rows[0]);
        } catch (err) {
          // If an upload fails after retries, log and rollback transaction
          logger.error('Upload failed for file', { file: file.originalname, err: err.message });
          await client.query('ROLLBACK');
          return res.status(502).json({ error: 'File upload failed', details: err.message });
        }
      }
    }

    await client.query('COMMIT');

    try {
      const reportDetailResult = await db.query(
        `
          SELECT
            r.id,
            r.created_at,
            r.status,
            COALESCE(r.summary, r.details, '') AS description,
            p.name AS project_name,
            u.full_name AS author_name
          FROM reports r
          LEFT JOIN projects p ON p.id = r.project_id
          LEFT JOIN users u ON u.id = r.author_id
          WHERE r.id = $1
          LIMIT 1
        `,
        [report.id]
      );

      if (reportDetailResult.rowCount > 0) {
        notifications.notify('report.created', {
          report: reportDetailResult.rows[0]
        });
      }
    } catch (notifyErr) {
      logger.error('Could not broadcast report notification', { err: notifyErr.message });
    }

    res.json({ report, files: savedFiles });
  } catch (err) {
    if (client) {
      await client.query('ROLLBACK');
    }
    logger.error('Failed to create report', { err: err.message });
    res.status(500).json({ error: 'Could not create report' });
  } finally {
    if (client) {
      client.release();
    }
  }
});

// Get comments for a specific report
router.get('/:reportId/comments', requireAuth, async (req, res) => {
  const reportId = parseInt(req.params.reportId, 10);
  if (!reportId) {
    return res.status(400).json({ error: 'Invalid report id' });
  }

  try {
    const result = await db.query(
      `SELECT rc.id, rc.report_id, rc.author_id, rc.comment, rc.created_at, u.full_name AS author_name
       FROM report_comments rc
       LEFT JOIN users u ON u.id = rc.author_id
       WHERE rc.report_id = $1
       ORDER BY rc.created_at DESC`,
      [reportId]
    );

    res.json({ comments: result.rows });
  } catch (err) {
    console.error('Failed to load comments', err);
    res.status(500).json({ error: 'Could not load comments' });
  }
});

// Add a comment to a report
router.post('/:reportId/comments', requireAuth, async (req, res) => {
  const reportId = parseInt(req.params.reportId, 10);
  const { comment } = req.body;
  const author_id = req.user && req.user.id;

  if (!author_id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!['supervisor', 'admin'].includes(req.user?.role)) {
    return res.status(403).json({ error: 'Supervisor role required to add comments' });
  }

  if (!reportId || !comment || comment.toString().trim() === '') {
    return res.status(400).json({ error: 'reportId and comment are required' });
  }

  try {
    // Verify report exists and supervisor assignment (unless admin)
    const reportRes = await db.query('SELECT project_id FROM reports WHERE id = $1 LIMIT 1', [
      reportId
    ]);
    if (reportRes.rowCount === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const projectId = reportRes.rows[0].project_id;
    if (req.user.role !== 'admin') {
      const assignment = await db.query(
        'SELECT 1 FROM project_supervisors WHERE project_id = $1 AND user_id = $2 LIMIT 1',
        [projectId, author_id]
      );
      if (assignment.rowCount === 0) {
        return res.status(403).json({ error: 'Project not assigned to this supervisor' });
      }
    }

    const insert = await db.query(
      'INSERT INTO report_comments (report_id, author_id, comment) VALUES ($1, $2, $3) RETURNING id, report_id, author_id, comment, created_at',
      [reportId, author_id, comment]
    );

    const saved = insert.rows[0];

    // Optional: notify admins about new comment
    try {
      notifications.notify('report.comment.created', { report_id: reportId, comment: saved });
    } catch (notifyErr) {
      logger.error('Could not send comment notification', { err: notifyErr.message });
    }

    res.json({ comment: saved });
  } catch (err) {
    console.error('Failed to add comment', err);
    res.status(500).json({ error: 'Could not add comment' });
  }
});

module.exports = router;

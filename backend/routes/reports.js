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

// Robust submit: use DB transaction and retries for uploads
router.post('/', requireAuth, upload.array('photos', 10), async (req, res) => {
  const { project_id, summary, details } = req.body;
  const author_id = req.user && req.user.id;
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      'INSERT INTO reports (project_id, author_id, summary, details) VALUES ($1, $2, $3, $4) RETURNING id, project_id, author_id, summary, details, created_at',
      [project_id || null, author_id || null, summary || null, details || null]
    );
    const report = result.rows[0];

    const savedFiles = [];
    if (req.files && req.files.length) {
      for (const file of req.files) {
        try {
          // retry uploads up to 3 times with backoff
          const uploaded = await retry(() => storage.upload(file), 3, 500);
          const insert = await client.query(
            'INSERT INTO evidence_files (report_id, filename, filepath, url, uploaded_by) VALUES ($1, $2, $3, $4, $5) RETURNING id, filename, filepath, url, uploaded_at',
            [report.id, uploaded.filename, uploaded.key || null, uploaded.url || null, author_id || null]
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
    res.json({ report, files: savedFiles });
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error('Failed to create report', { err: err.message });
    res.status(500).json({ error: 'Could not create report' });
  } finally {
    client.release();
  }
});

module.exports = router;

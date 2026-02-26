const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// List evidence files for a report (protected)
router.get('/report/:reportId', requireAuth, async (req, res) => {
  const { reportId } = req.params;
  try {
    const result = await db.query(
      'SELECT id, filename, url, filepath, uploaded_by, uploaded_at FROM evidence_files WHERE report_id = $1 ORDER BY uploaded_at DESC',
      [reportId]
    );
    res.json({ files: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch evidence files' });
  }
});

module.exports = router;

const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { requireAdmin } = require('../middleware/auth');
const notifications = require('../utils/notifications');

const router = express.Router();

async function buildDashboardSummary() {
  const metricsQuery = db.query(`
      SELECT
        (SELECT COUNT(*)::int FROM projects) AS total_projects,
        (SELECT COUNT(*)::int FROM projects WHERE status = 'in-progress') AS in_progress_projects,
        (SELECT COUNT(*)::int FROM projects WHERE status = 'planning') AS planning_projects,
        (SELECT COUNT(*)::int FROM projects WHERE status = 'completed') AS completed_projects,
        (
          SELECT COUNT(*)::int
          FROM projects p
          LEFT JOIN project_supervisors ps ON ps.project_id = p.id
          WHERE ps.id IS NULL
        ) AS projects_without_supervisor,
        (SELECT COUNT(*)::int FROM reports) AS total_reports,
        (
          SELECT COUNT(*)::int
          FROM reports
          WHERE created_at >= NOW() - INTERVAL '24 hours'
        ) AS reports_last_24h,
        (
          SELECT COUNT(*)::int
          FROM reports
          WHERE status = 'pending'
        ) AS pending_reports,
        (
          SELECT COUNT(*)::int
          FROM reports
          WHERE status = 'completed'
        ) AS completed_reports,
        (
          SELECT COUNT(*)::int
          FROM reports
          WHERE status = 'reviewed'
        ) AS reviewed_reports,
        (
          SELECT COUNT(*)::int
          FROM users
          WHERE role = 'supervisor' AND is_active = true
        ) AS active_supervisors,
        (
          SELECT COUNT(*)::int
          FROM users
          WHERE is_active = true
        ) AS active_users
    `);

  const recentReportsQuery = db.query(
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
      ORDER BY r.created_at DESC
      LIMIT 6
    `
  );

  const [metricsResult, recentReportsResult] = await Promise.all([metricsQuery, recentReportsQuery]);

  return {
    metrics: metricsResult.rows[0],
    recent_reports: recentReportsResult.rows,
    generated_at: new Date().toISOString()
  };
}

function getSummarySignature(summary) {
  return JSON.stringify({
    metrics: summary.metrics,
    recent_reports: summary.recent_reports
  });
}

function getTokenFromRequest(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }

  return null;
}

function getAdminFromRequest(req) {
  const token = getTokenFromRequest(req);
  if (!token) {
    return null;
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    if (payload.role !== 'admin') {
      return null;
    }
    return payload;
  } catch (_err) {
    return null;
  }
}

// Consolidated admin dashboard metrics
router.get('/summary', requireAdmin, async (_req, res) => {
  try {
    const summary = await buildDashboardSummary();
    res.json(summary);
  } catch (err) {
    console.error('Error generating dashboard summary:', err);
    res.status(500).json({ error: 'Could not generate dashboard summary' });
  }
});

// SSE stream for realtime dashboard updates
router.get('/stream', async (req, res) => {
  const adminUser = getAdminFromRequest(req);
  if (!adminUser) {
    return res.status(401).json({ error: 'Invalid token or admin access required' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  let lastSummarySignature = '';

  const sendSummary = async force => {
    try {
      const summary = await buildDashboardSummary();
      const currentSignature = getSummarySignature(summary);

      if (!force && currentSignature === lastSummarySignature) {
        res.write(`event: unchanged\n`);
        res.write(`data: ${JSON.stringify({ checked_at: new Date().toISOString() })}\n\n`);
        return;
      }

      lastSummarySignature = currentSignature;
      res.write(`event: summary\n`);
      res.write(`data: ${JSON.stringify(summary)}\n\n`);
    } catch (err) {
      res.write(`event: error\n`);
      res.write(`data: ${JSON.stringify({ message: 'Could not refresh dashboard summary' })}\n\n`);
    }
  };

  // Initial event
  sendSummary(true);

  const unsubscribeNotifications = notifications.subscribe((eventName, payload) => {
    if (eventName !== 'report.created') {
      return;
    }

    const safePayload = {
      type: 'report.created',
      created_at: new Date().toISOString(),
      report: payload?.report || null
    };

    res.write(`event: notification\n`);
    res.write(`data: ${JSON.stringify(safePayload)}\n\n`);
  });

  const intervalId = setInterval(() => sendSummary(false), 15000);
  const heartbeatId = setInterval(() => {
    res.write(`: heartbeat\n\n`);
  }, 20000);

  req.on('close', () => {
    clearInterval(intervalId);
    clearInterval(heartbeatId);
    unsubscribeNotifications();
    res.end();
  });
});

module.exports = router;

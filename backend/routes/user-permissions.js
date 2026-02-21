const express = require('express');
const db = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all permissions for a specific user
router.get('/:userId/permissions', requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Check if user is admin or the user themselves
    const currentUser = req.user;
    if (currentUser.role !== 'admin' && currentUser.id != userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const result = await db.pool.query(
      'SELECT permission_id FROM user_permissions WHERE user_id = $1',
      [userId]
    );

    const permissions = result.rows.map(row => row.permission_id);
    res.json({ permissions });
  } catch (err) {
    console.error('Error fetching user permissions:', err);
    res.status(500).json({ error: 'Failed to fetch permissions' });
  }
});

// Grant permission to a user
router.post('/:userId/permissions/:permissionId', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { userId, permissionId } = req.params;

    // Check if permission exists
    const permCheck = await db.pool.query(
      'SELECT id FROM permissions WHERE id = $1',
      [permissionId]
    );
    if (permCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Permission not found' });
    }

    // Insert user permission
    const result = await db.pool.query(
      'INSERT INTO user_permissions (user_id, permission_id, granted_by) VALUES ($1, $2, $3) ON CONFLICT (user_id, permission_id) DO NOTHING RETURNING id',
      [userId, permissionId, req.user.id]
    );

    res.json({ message: 'Permission granted', id: result.rows[0]?.id });
  } catch (err) {
    console.error('Error granting permission:', err);
    res.status(500).json({ error: 'Failed to grant permission' });
  }
});

// Revoke permission from a user
router.delete('/:userId/permissions/:permissionId', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { userId, permissionId } = req.params;

    await db.pool.query(
      'DELETE FROM user_permissions WHERE user_id = $1 AND permission_id = $2',
      [userId, permissionId]
    );

    res.json({ message: 'Permission revoked' });
  } catch (err) {
    console.error('Error revoking permission:', err);
    res.status(500).json({ error: 'Failed to revoke permission' });
  }
});

module.exports = router;

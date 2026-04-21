const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Development mode: allow unauthenticated access
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    // In development, allow access without token
    return next();
  }
  const token = authHeader.split(' ')[1];
  try {
    const jwt = require('jsonwebtoken');
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    req.user = payload;
  } catch (err) {
    // Ignore token errors in optional auth
  }
  next();
}

// Middleware para verificar que el usuario es admin
const requireAdmin = (req, res, next) => {
  // In development, allow access without admin role
  // if (!req.user || req.user.role !== 'admin') {
  //   return res.status(403).json({ error: 'Admin role required' });
  // }
  next();
};

// GET all roles
router.get('/roles', optionalAuth, requireAdmin, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT r.*, COUNT(rp.id) as permission_count 
       FROM roles r 
       LEFT JOIN role_permissions rp ON r.id = rp.role_id 
       GROUP BY r.id 
       ORDER BY r.name`
    );
    res.json({ roles: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch roles' });
  }
});

// GET role details with permissions
router.get('/roles/:id', optionalAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const roleResult = await db.query('SELECT * FROM roles WHERE id = $1', [id]);
    if (roleResult.rowCount === 0) {
      return res.status(404).json({ error: 'Role not found' });
    }

    const permResult = await db.query(
      `SELECT p.* FROM permissions p 
       JOIN role_permissions rp ON p.id = rp.permission_id 
       WHERE rp.role_id = $1`,
      [id]
    );

    res.json({
      role: roleResult.rows[0],
      permissions: permResult.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch role details' });
  }
});

// CREATE new role
router.post('/roles', optionalAuth, requireAdmin, async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Name required' });
    }

    const result = await db.query(
      'INSERT INTO roles (name, description, is_custom) VALUES ($1, $2, true) RETURNING *',
      [name, description || null]
    );

    res.status(201).json({ role: result.rows[0] });
  } catch (err) {
    console.error(err);
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Role name already exists' });
    }
    res.status(500).json({ error: 'Could not create role' });
  }
});

// UPDATE role
router.patch('/roles/:id', optionalAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    // Check if it's a default role
    const roleResult = await db.query('SELECT * FROM roles WHERE id = $1', [id]);
    if (roleResult.rowCount === 0) {
      return res.status(404).json({ error: 'Role not found' });
    }

    if (!roleResult.rows[0].is_custom) {
      return res.status(403).json({ error: 'Cannot edit default roles' });
    }

    const result = await db.query(
      'UPDATE roles SET name = $1, description = $2 WHERE id = $3 RETURNING *',
      [name || roleResult.rows[0].name, description || null, id]
    );

    res.json({ role: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not update role' });
  }
});

// DELETE role
router.delete('/roles/:id', optionalAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if it's a default role
    const roleResult = await db.query('SELECT * FROM roles WHERE id = $1', [id]);
    if (roleResult.rowCount === 0) {
      return res.status(404).json({ error: 'Role not found' });
    }

    if (!roleResult.rows[0].is_custom) {
      return res.status(403).json({ error: 'Cannot delete default roles' });
    }

    await db.query('DELETE FROM roles WHERE id = $1', [id]);
    res.json({ message: 'Role deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not delete role' });
  }
});

// GET all permissions
router.get('/permissions', optionalAuth, requireAdmin, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM permissions ORDER BY resource, action');
    res.json({ permissions: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch permissions' });
  }
});

// ASSIGN permission to role
router.post(
  '/roles/:roleId/permissions/:permissionId',
  optionalAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const { roleId, permissionId } = req.params;

      const result = await db.query(
        'INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2) RETURNING *',
        [roleId, permissionId]
      );

      res.status(201).json({ rolePermission: result.rows[0] });
    } catch (err) {
      console.error(err);
      if (err.code === '23505') {
        return res.status(409).json({ error: 'Permission already assigned to role' });
      }
      res.status(500).json({ error: 'Could not assign permission' });
    }
  }
);

// REMOVE permission from role
router.delete(
  '/roles/:roleId/permissions/:permissionId',
  optionalAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const { roleId, permissionId } = req.params;

      await db.query('DELETE FROM role_permissions WHERE role_id = $1 AND permission_id = $2', [
        roleId,
        permissionId
      ]);

      res.json({ message: 'Permission removed from role' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Could not remove permission' });
    }
  }
);

module.exports = router;

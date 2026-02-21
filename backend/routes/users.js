const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Get current user profile
router.get('/profile', requireAuth, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, username, role, full_name, email, phone, department, profile_image FROM users WHERE id = $1',
      [req.user.id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load profile' });
  }
});

// Update current user profile
router.put('/profile', requireAuth, async (req, res) => {
  const { full_name, email, phone, department, profile_image } = req.body;
  try {
    const result = await db.query(
      'UPDATE users SET full_name = $1, email = $2, phone = $3, department = $4, profile_image = $5 WHERE id = $6 RETURNING id, username, role, full_name, email, phone, department, profile_image',
      [full_name || null, email || null, phone || null, department || null, profile_image || null, req.user.id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not update profile' });
  }
});

// Update user profile (can be self or admin)
router.patch('/:userId', requireAuth, async (req, res) => {
  const { userId } = req.params;
  const { full_name, email, phone, department, profile_image } = req.body;
  
  try {
    // User can only update their own profile unless they're admin
    if (req.user.id !== parseInt(userId) && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Can only update your own profile' });
    }

    const result = await db.query(
      'UPDATE users SET full_name = $1, email = $2, phone = $3, department = $4, profile_image = $5 WHERE id = $6 RETURNING id, username, role, full_name, email, phone, department, profile_image, is_active',
      [full_name || null, email || null, phone || null, department || null, profile_image || null, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'Profile updated successfully', user: result.rows[0] });
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({ error: 'Could not update profile' });
  }
});

// Update user role (admin only)
router.patch('/:userId/role', requireAuth, async (req, res) => {
  try {
    // Check if requester is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can change roles' });
    }

    const { userId } = req.params;
    const { role } = req.body;

    if (!['admin', 'supervisor'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const result = await db.query(
      'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, username, role, full_name, email',
      [role, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'Role updated successfully', user: result.rows[0] });
  } catch (err) {
    console.error('Error updating role:', err);
    res.status(500).json({ error: 'Could not update role' });
  }
});

module.exports = router;

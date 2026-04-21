const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');

const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Register a new user (simple)
router.post('/register', async (req, res) => {
  const { username, password, role, full_name, email, phone, department, profile_image } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'username and password required' });
  }
  const hashed = await bcrypt.hash(password, 10);
  try {
    const result = await db.query(
      'INSERT INTO users (username, password_hash, role, full_name, email, phone, department, profile_image, is_active) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true) RETURNING id, username, role, full_name, email, phone, department, profile_image, is_active',
      [
        username,
        hashed,
        role || 'user',
        full_name || null,
        email || null,
        phone || null,
        department || null,
        profile_image || null
      ]
    );
    const user = result.rows[0];
    res.status(201).json({ message: 'User created', user });
  } catch (err) {
    console.error(err);
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Username already exists' });
    }
    res.status(500).json({ error: 'Could not create user' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'username and password required' });
  }
  try {
    const result = await db.query(
      'SELECT id, username, password_hash, role, is_active, full_name, email, phone, department, profile_image FROM users WHERE username = $1',
      [username]
    );
    const user = result.rows[0];
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    if (user.is_active === false) {
      return res.status(403).json({ error: 'Account is deactivated' });
    }
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'dev-secret',
      { expiresIn: '8h' }
    );
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        department: user.department,
        profile_image: user.profile_image
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Development mode: allow unauthenticated access
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    // In development, allow access without token
    return next();
  }
  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    req.user = payload;
  } catch (err) {
    // Ignore token errors in optional auth
  }
  next();
}

// Get all users - admin only
router.get('/users', optionalAuth, async (req, res) => {
  try {
    // In development, allow all users access without checking role
    // if (!req.user || req.user.role !== 'admin') {
    //   return res.status(403).json({ error: 'Admin role required' });
    // }
    const result = await db.query(
      'SELECT id, username, role, full_name, email, phone, department, is_active FROM users ORDER BY created_at DESC'
    );
    res.json({ users: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch users' });
  }
});

// Deactivate (or reactivate) a user - admin only
router.patch('/:id/active', requireAuth, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin role required' });
    }
    const { id } = req.params;
    const { active } = req.body; // boolean
    if (typeof active !== 'boolean') {
      return res.status(400).json({ error: 'active boolean required in body' });
    }
    const result = await db.query(
      'UPDATE users SET is_active = $1 WHERE id = $2 RETURNING id, username, role, full_name, email, is_active',
      [active, id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User status updated', user: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not update user status' });
  }
});

// Delete a user - admin only
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin role required' });
    }
    const { id } = req.params;
    const result = await db.query(
      'DELETE FROM users WHERE id = $1 RETURNING id, username, full_name',
      [id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User deleted successfully', user: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not delete user' });
  }
});

module.exports = router;

require('dotenv').config();
const db = require('./db');

async function removeUserRole() {
  try {
    // Delete the 'user' role and its permissions
    await db.pool.query('DELETE FROM role_permissions WHERE role_id = (SELECT id FROM roles WHERE name = $1)', ['user']);
    await db.pool.query('DELETE FROM roles WHERE name = $1', ['user']);
    console.log('✓ User role removed from database');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

removeUserRole();

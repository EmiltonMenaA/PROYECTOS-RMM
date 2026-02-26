require('dotenv').config();
const db = require('./db');

async function checkSchema() {
  try {
    console.log('Checking table schemas...\n');

    // Check users table structure
    const usersSchema = await db.query(`
      SELECT column_name, data_type FROM information_schema.columns 
      WHERE table_name = 'users' ORDER BY ordinal_position
    `);
    console.log('Users table columns:');
    usersSchema.rows.forEach(col => console.log(`  - ${col.column_name} (${col.data_type})`));

    console.log('\n---\n');

    // Check reports table structure
    const reportsSchema = await db.query(`
      SELECT column_name, data_type FROM information_schema.columns 
      WHERE table_name = 'reports' ORDER BY ordinal_position
    `);
    console.log('Reports table columns:');
    reportsSchema.rows.forEach(col => console.log(`  - ${col.column_name} (${col.data_type})`));

    console.log('\n---\n');

    // Check projects table structure
    const projectsSchema = await db.query(`
      SELECT column_name, data_type FROM information_schema.columns 
      WHERE table_name = 'projects' ORDER BY ordinal_position
    `);
    console.log('Projects table columns:');
    projectsSchema.rows.forEach(col => console.log(`  - ${col.column_name} (${col.data_type})`));

    console.log('\n---\n');

    // Check projects data
    const projects = await db.query('SELECT id, name, status FROM projects LIMIT 3');
    console.log(`Projects in DB: ${projects.rows.length}`);
    if (projects.rows.length > 0) {
      console.log(JSON.stringify(projects.rows, null, 2));
    }

    console.log('\n---\n');

    // Check supervisors
    const supervisors = await db.query(
      'SELECT id, email, role FROM users WHERE role = $1 LIMIT 3',
      ['supervisor']
    );
    console.log(`Supervisors in DB: ${supervisors.rows.length}`);
    if (supervisors.rows.length > 0) {
      console.log(JSON.stringify(supervisors.rows, null, 2));
    }

    console.log('\n---\n');

    // Check reports
    const reports = await db.query(
      'SELECT id, project_id, author_id, summary, created_at, status FROM reports LIMIT 3'
    );
    console.log(`Reports in DB: ${reports.rows.length}`);
    if (reports.rows.length > 0) {
      console.log(JSON.stringify(reports.rows, null, 2));
    }

    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

checkSchema();

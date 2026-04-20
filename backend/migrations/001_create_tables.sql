-- Schema: create basic tables for RMM
-- Run with: psql "<DATABASE_URL>" -f backend/migrations/001_create_tables.sql

-- Users
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  role TEXT NOT NULL DEFAULT 'user',
  full_name TEXT,
  email TEXT,
  phone TEXT,
  department TEXT,
  profile_image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Projects
CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT,
  description TEXT,
  location TEXT,
  lead INTEGER REFERENCES users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'planning',
  contract_value TEXT,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Project Supervisors (Many-to-Many relationship)
CREATE TABLE IF NOT EXISTS project_supervisors (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(project_id, user_id)
);

-- Reports (daily reports)
CREATE TABLE IF NOT EXISTS reports (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
  author_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  summary TEXT,
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Evidence / uploaded files linked to reports
CREATE TABLE IF NOT EXISTS evidence_files (
  id SERIAL PRIMARY KEY,
  report_id INTEGER REFERENCES reports(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  filepath TEXT,
  url TEXT,
  uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes to speed lookups
CREATE INDEX IF NOT EXISTS idx_projects_lead ON projects(lead);
CREATE INDEX IF NOT EXISTS idx_project_supervisors_project ON project_supervisors(project_id);
CREATE INDEX IF NOT EXISTS idx_project_supervisors_user ON project_supervisors(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_project ON reports(project_id);
CREATE INDEX IF NOT EXISTS idx_reports_author ON reports(author_id);

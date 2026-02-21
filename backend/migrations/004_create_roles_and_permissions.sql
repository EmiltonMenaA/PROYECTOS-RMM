-- Roles and Permissions Management
-- Run with: psql "<DATABASE_URL>" -f backend/migrations/004_create_roles_and_permissions.sql

-- Roles Table
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_custom BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Permissions Table
CREATE TABLE IF NOT EXISTS permissions (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  resource TEXT NOT NULL,
  action TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Role-Permissions Junction Table
CREATE TABLE IF NOT EXISTS role_permissions (
  id SERIAL PRIMARY KEY,
  role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(role_id, permission_id)
);

-- Insert default roles
INSERT INTO roles (name, description, is_custom) VALUES
  ('admin', 'Administrador del sistema - Acceso completo', false),
  ('supervisor', 'Supervisor de proyectos - Gestión de proyectos y reportes', false),
  ('user', 'Usuario estándar - Acceso limitado', false)
ON CONFLICT (name) DO NOTHING;

-- Insert default permissions
INSERT INTO permissions (name, description, resource, action) VALUES
  ('view_projects', 'Ver proyectos', 'projects', 'read'),
  ('create_projects', 'Crear proyectos', 'projects', 'create'),
  ('edit_projects', 'Editar proyectos', 'projects', 'update'),
  ('delete_projects', 'Eliminar proyectos', 'projects', 'delete'),
  
  ('view_users', 'Ver usuarios', 'users', 'read'),
  ('create_users', 'Crear usuarios', 'users', 'create'),
  ('edit_users', 'Editar usuarios', 'users', 'update'),
  ('delete_users', 'Eliminar usuarios', 'users', 'delete'),
  ('manage_roles', 'Gestionar roles', 'users', 'manage_roles'),
  
  ('view_reports', 'Ver reportes', 'reports', 'read'),
  ('create_reports', 'Crear reportes', 'reports', 'create'),
  ('edit_reports', 'Editar reportes', 'reports', 'update'),
  ('delete_reports', 'Eliminar reportes', 'reports', 'delete'),
  
  ('view_supervisors', 'Ver supervisores', 'supervisors', 'read'),
  ('manage_supervisors', 'Gestionar supervisores', 'supervisors', 'manage'),
  ('assign_supervisors', 'Asignar supervisores a proyectos', 'supervisors', 'assign'),
  
  ('view_dashboard', 'Ver dashboard', 'dashboard', 'read'),
  ('view_active_projects', 'Ver proyectos activos', 'projects', 'view_active')
ON CONFLICT (name) DO NOTHING;

-- Assign all permissions to admin role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p WHERE r.name = 'admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Assign limited permissions to supervisor role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p 
WHERE r.name = 'supervisor' AND p.action IN ('read', 'create', 'update')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Assign minimal permissions to user role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p 
WHERE r.name = 'user' AND p.name IN ('view_projects', 'view_reports', 'view_supervisors', 'view_dashboard', 'view_active_projects')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Add city field to projects for grouping and filtering
ALTER TABLE projects ADD COLUMN IF NOT EXISTS city TEXT;

-- Add profile fields to users table
-- Run with: psql "<DATABASE_URL>" -f backend/migrations/002_add_user_profile_fields.sql

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS department TEXT,
  ADD COLUMN IF NOT EXISTS profile_image TEXT;

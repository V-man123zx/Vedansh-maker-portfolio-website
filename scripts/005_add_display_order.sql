-- Add display_order column to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Backfill existing rows: assign sequential order based on created_at (newest = 0, next = 1, etc.)
WITH ordered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at DESC) - 1 AS rn
  FROM projects
)
UPDATE projects
SET display_order = ordered.rn
FROM ordered
WHERE projects.id = ordered.id;

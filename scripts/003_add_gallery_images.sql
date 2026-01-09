-- Add gallery_images column to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS gallery_images TEXT[] DEFAULT '{}';

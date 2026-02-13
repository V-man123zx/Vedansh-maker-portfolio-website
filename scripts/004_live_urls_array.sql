-- Migrate live_url from TEXT to TEXT[] to support multiple video/live links
-- First, convert existing single values into arrays
ALTER TABLE projects
  ADD COLUMN live_urls TEXT[] DEFAULT '{}';

UPDATE projects
  SET live_urls = ARRAY[live_url]
  WHERE live_url IS NOT NULL AND live_url != '';

ALTER TABLE projects
  DROP COLUMN live_url;

ALTER TABLE projects
  RENAME COLUMN live_urls TO live_url;

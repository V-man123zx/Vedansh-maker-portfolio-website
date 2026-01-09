-- Create a storage bucket for project images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project-images', 
  'project-images', 
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public read access for project images" ON storage.objects;
DROP POLICY IF EXISTS "Allow uploads to project images" ON storage.objects;
DROP POLICY IF EXISTS "Allow deletes from project images" ON storage.objects;

-- Allow public read access to the bucket
CREATE POLICY "Public read access for project images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'project-images');

-- Allow all uploads (service role will handle this)
CREATE POLICY "Allow uploads to project images"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'project-images');

-- Allow all updates
CREATE POLICY "Allow updates to project images"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'project-images');

-- Allow all deletes
CREATE POLICY "Allow deletes from project images"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'project-images');

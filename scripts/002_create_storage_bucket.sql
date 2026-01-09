-- Create a storage bucket for project images
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-images', 'project-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to the bucket
CREATE POLICY "Public read access for project images"
ON storage.objects FOR SELECT
USING (bucket_id = 'project-images');

-- Allow authenticated uploads (we'll use service role for admin uploads)
CREATE POLICY "Allow uploads to project images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'project-images');

-- Allow deletes
CREATE POLICY "Allow deletes from project images"
ON storage.objects FOR DELETE
USING (bucket_id = 'project-images');

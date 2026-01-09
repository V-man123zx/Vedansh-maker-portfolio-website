-- Create projects table for maker portfolio
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  image_url TEXT,
  technologies TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'in-progress',
  github_url TEXT,
  live_url TEXT,
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_projects_category ON projects(category);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_created_at ON projects(created_at DESC);

-- Enable public access for portfolio (no auth required for viewing)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view projects (public portfolio)
CREATE POLICY "Allow public read access" ON projects FOR SELECT USING (true);

-- Allow anyone to insert projects (for demo - in production you'd want auth)
CREATE POLICY "Allow public insert" ON projects FOR INSERT WITH CHECK (true);

-- Allow anyone to update projects (for demo)
CREATE POLICY "Allow public update" ON projects FOR UPDATE USING (true);

-- Allow anyone to delete projects (for demo)
CREATE POLICY "Allow public delete" ON projects FOR DELETE USING (true);

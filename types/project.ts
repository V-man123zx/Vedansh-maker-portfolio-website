export interface Project {
  id: string
  title: string
  description: string | null
  category: string
  image_url: string | null
  gallery_images: string[]
  technologies: string[]
  status: "in-progress" | "completed" | "planned"
  github_url: string | null
  live_url: string | null
  content: string | null
  created_at: string
  updated_at: string
}

export type ProjectInsert = Omit<Project, "id" | "created_at" | "updated_at">
export type ProjectUpdate = Partial<ProjectInsert>

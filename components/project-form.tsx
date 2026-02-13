"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ImageUpload } from "./image-upload"
import { GalleryUpload } from "./gallery-upload"
import { Plus, X } from "lucide-react"
import type { Project, ProjectInsert } from "@/types/project"

interface ProjectFormProps {
  project?: Project
  onSubmit: (project: ProjectInsert) => Promise<void>
  onCancel: () => void
  isLoading: boolean
}

const DEFAULT_CATEGORIES = [
  "Electronics",
  "Mechanical",
  "Software",
  "3D Printing",
  "Robotics",
  "IoT",
  "Woodworking",
  "ICR247",
  "Other",
]

function formatDateForInput(dateString: string | undefined): string {
  if (!dateString) return new Date().toISOString().split("T")[0]
  return new Date(dateString).toISOString().split("T")[0]
}

export function ProjectForm({ project, onSubmit, onCancel, isLoading }: ProjectFormProps) {
  const [title, setTitle] = useState(project?.title || "")
  const [description, setDescription] = useState(project?.description || "")
  const [category, setCategory] = useState(project?.category || "Electronics")
  const [imageUrl, setImageUrl] = useState(project?.image_url || "")
  const [galleryImages, setGalleryImages] = useState<string[]>(project?.gallery_images || [])
  const [technologies, setTechnologies] = useState(project?.technologies?.join(", ") || "")
  const [status, setStatus] = useState<"in-progress" | "completed" | "planned">(
    (project?.status as "in-progress" | "completed" | "planned") || "in-progress",
  )
  const [githubUrl, setGithubUrl] = useState(project?.github_url || "")
  const [liveUrls, setLiveUrls] = useState<string[]>(
    project?.live_url && project.live_url.length > 0 ? project.live_url : [""]
  )
  const [content, setContent] = useState(project?.content || "")
  const [createdAt, setCreatedAt] = useState(formatDateForInput(project?.created_at))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const techArray = technologies
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)

    await onSubmit({
      title,
      description: description || null,
      category,
      image_url: imageUrl || null,
      gallery_images: galleryImages,
      technologies: techArray,
      status,
      github_url: githubUrl || null,
      live_url: liveUrls.filter((u) => u.trim() !== "").length > 0 ? liveUrls.filter((u) => u.trim() !== "") : null,
      content: content || null,
      created_at: new Date(createdAt).toISOString(),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Project Title *</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="My Awesome Project"
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {DEFAULT_CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as "in-progress" | "completed" | "planned")}>
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="planned">Planned</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="createdAt">Project Date</Label>
        <Input id="createdAt" type="date" value={createdAt} onChange={(e) => setCreatedAt(e.target.value)} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Short Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="A brief overview of your project..."
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="technologies">Technologies (comma-separated)</Label>
        <Input
          id="technologies"
          value={technologies}
          onChange={(e) => setTechnologies(e.target.value)}
          placeholder="Arduino, Python, 3D Printing, etc."
        />
      </div>

      <ImageUpload value={imageUrl} onChange={setImageUrl} />

      <GalleryUpload images={galleryImages} onChange={setGalleryImages} maxImages={10} />

      <div className="space-y-2">
        <Label htmlFor="githubUrl">GitHub URL</Label>
        <Input
          id="githubUrl"
          type="url"
          value={githubUrl}
          onChange={(e) => setGithubUrl(e.target.value)}
          placeholder="https://github.com/..."
        />
      </div>

      <div className="space-y-2">
        <Label>Live/Demo/Video URLs</Label>
        <div className="space-y-2">
          {liveUrls.map((url, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                type="url"
                value={url}
                onChange={(e) => {
                  const updated = [...liveUrls]
                  updated[index] = e.target.value
                  setLiveUrls(updated)
                }}
                placeholder="https://..."
              />
              {liveUrls.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  onClick={() => setLiveUrls(liveUrls.filter((_, i) => i !== index))}
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Remove URL</span>
                </Button>
              )}
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setLiveUrls([...liveUrls, ""])}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add another link
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Detailed Description (optional)</Label>
        <Textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Add more details about your project, build process, challenges, etc."
          rows={4}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading || !title}>
          {isLoading ? "Saving..." : project ? "Update Project" : "Create Project"}
        </Button>
      </div>
    </form>
  )
}

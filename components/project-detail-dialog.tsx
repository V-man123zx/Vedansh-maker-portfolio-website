"use client"

import Image from "next/image"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Github, ExternalLink, Calendar, Clock } from "lucide-react"
import { ImageGallery } from "./image-gallery"
import type { Project } from "@/types/project"

interface ProjectDetailDialogProps {
  project: Project | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProjectDetailDialog({ project, open, onOpenChange }: ProjectDetailDialogProps) {
  if (!project) return null

  const statusColors = {
    "in-progress": "bg-amber-500/10 text-amber-600 border-amber-500/20",
    completed: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    planned: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">{project.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Cover Image */}
          {project.image_url && (
            <div className="relative aspect-video overflow-hidden rounded-lg">
              <Image src={project.image_url || "/placeholder.svg"} alt={project.title} fill className="object-cover" />
            </div>
          )}

          {/* Status and Category */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={statusColors[project.status as keyof typeof statusColors]}>
              {project.status}
            </Badge>
            <Badge variant="secondary">{project.category}</Badge>
          </div>

          {/* Description */}
          {project.description && (
            <div>
              <h3 className="mb-2 font-semibold text-foreground">Overview</h3>
              <p className="text-muted-foreground">{project.description}</p>
            </div>
          )}

          {/* Extended Content */}
          {project.content && (
            <div>
              <h3 className="mb-2 font-semibold text-foreground">Details</h3>
              <div className="prose prose-sm max-w-none text-muted-foreground">
                {project.content.split("\n").map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
              </div>
            </div>
          )}

          {project.gallery_images && project.gallery_images.length > 0 && (
            <ImageGallery images={project.gallery_images} projectTitle={project.title} />
          )}

          {/* Technologies */}
          {project.technologies && project.technologies.length > 0 && (
            <div>
              <h3 className="mb-2 font-semibold text-foreground">Technologies Used</h3>
              <div className="flex flex-wrap gap-2">
                {project.technologies.map((tech) => (
                  <span key={tech} className="rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground">
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Dates */}
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Created: {formatDate(project.created_at)}
            </div>
            {project.updated_at !== project.created_at && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Updated: {formatDate(project.updated_at)}
              </div>
            )}
          </div>

          {/* Links */}
          {(project.github_url || (project.live_url && project.live_url.length > 0)) && (
            <div className="flex flex-wrap gap-3 border-t border-border pt-4">
              {project.github_url && (
                <Button variant="outline" asChild>
                  <a href={project.github_url} target="_blank" rel="noopener noreferrer">
                    <Github className="mr-2 h-4 w-4" />
                    View Source
                  </a>
                </Button>
              )}
              {project.live_url && project.live_url.length > 0 && project.live_url.map((url, index) => (
                <Button key={index} asChild>
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    {project.live_url && project.live_url.length > 1 ? `View Live ${index + 1}` : "View Live"}
                  </a>
                </Button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

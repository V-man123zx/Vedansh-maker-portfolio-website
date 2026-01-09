"use client"

import { useState } from "react"
import Image from "next/image"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Github, ExternalLink, MoreVertical, Pencil, Trash2 } from "lucide-react"
import type { Project } from "@/types/project"
import { deleteProject } from "@/lib/actions/projects"
import { EditProjectDialog } from "./edit-project-dialog"
import { ProjectDetailDialog } from "./project-detail-dialog"
import { AdminAuthDialog } from "./admin-auth-dialog"
import { checkAdminAuth } from "@/lib/admin-auth"

interface ProjectCardProps {
  project: Project
}

export function ProjectCard({ project }: ProjectCardProps) {
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<"edit" | "delete" | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const statusColors = {
    "in-progress": "bg-amber-500/10 text-amber-600 border-amber-500/20",
    completed: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    planned: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  }

  const handleAdminAction = async (action: "edit" | "delete") => {
    const isAuthenticated = await checkAdminAuth()
    if (isAuthenticated) {
      if (action === "edit") {
        setIsEditOpen(true)
      } else {
        handleDelete()
      }
    } else {
      setPendingAction(action)
      setIsAuthOpen(true)
    }
  }

  const handleAuthSuccess = () => {
    if (pendingAction === "edit") {
      setIsEditOpen(true)
    } else if (pendingAction === "delete") {
      handleDelete()
    }
    setPendingAction(null)
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this project?")) return
    setIsDeleting(true)
    try {
      await deleteProject(project.id)
    } catch (error) {
      console.error("Failed to delete project:", error)
      setIsDeleting(false)
    }
  }

  return (
    <>
      <Card
        className="group cursor-pointer overflow-hidden transition-all hover:shadow-lg"
        onClick={() => setIsDetailOpen(true)}
      >
        <CardHeader className="relative p-0">
          <div className="relative aspect-video overflow-hidden bg-muted">
            {project.image_url ? (
              <Image
                src={project.image_url || "/placeholder.svg"}
                alt={project.title}
                fill
                className="object-cover transition-transform group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-gradient-to-br from-muted to-muted-foreground/10">
                <span className="text-4xl font-bold text-muted-foreground/30">{project.title.charAt(0)}</span>
              </div>
            )}
          </div>
          <div className="absolute right-2 top-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    handleAdminAction("edit")
                  }}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    handleAdminAction("delete")
                  }}
                  disabled={isDeleting}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {isDeleting ? "Deleting..." : "Delete"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="p-4">
          <div className="mb-2 flex items-center gap-2">
            <Badge variant="outline" className={statusColors[project.status as keyof typeof statusColors]}>
              {project.status}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {project.category}
            </Badge>
          </div>
          <h3 className="mb-2 text-lg font-semibold text-foreground">{project.title}</h3>
          <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">{project.description}</p>
          {project.technologies && project.technologies.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {project.technologies.slice(0, 4).map((tech) => (
                <span key={tech} className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  {tech}
                </span>
              ))}
              {project.technologies.length > 4 && (
                <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  +{project.technologies.length - 4}
                </span>
              )}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex gap-2 border-t p-4" onClick={(e) => e.stopPropagation()}>
          {project.github_url && (
            <Button variant="outline" size="sm" asChild>
              <a href={project.github_url} target="_blank" rel="noopener noreferrer">
                <Github className="mr-2 h-4 w-4" />
                Code
              </a>
            </Button>
          )}
          {project.live_url && (
            <Button variant="outline" size="sm" asChild>
              <a href={project.live_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Live
              </a>
            </Button>
          )}
        </CardFooter>
      </Card>

      <EditProjectDialog project={project} open={isEditOpen} onOpenChange={setIsEditOpen} />
      <ProjectDetailDialog project={project} open={isDetailOpen} onOpenChange={setIsDetailOpen} />
      <AdminAuthDialog open={isAuthOpen} onOpenChange={setIsAuthOpen} onAuthenticated={handleAuthSuccess} />
    </>
  )
}

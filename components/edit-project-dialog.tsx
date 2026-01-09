"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ProjectForm } from "./project-form"
import { updateProject } from "@/lib/actions/projects"
import type { Project, ProjectInsert } from "@/types/project"

interface EditProjectDialogProps {
  project: Project
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditProjectDialog({ project, open, onOpenChange }: EditProjectDialogProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (data: ProjectInsert) => {
    setIsLoading(true)
    try {
      await updateProject(project.id, data)
      onOpenChange(false)
    } catch (error) {
      console.error("Failed to update project:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
          <DialogDescription>Update your project details</DialogDescription>
        </DialogHeader>
        <ProjectForm
          project={project}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
          isLoading={isLoading}
        />
      </DialogContent>
    </Dialog>
  )
}

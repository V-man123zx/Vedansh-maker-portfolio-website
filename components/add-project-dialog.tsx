"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { ProjectForm } from "./project-form"
import { AdminAuthDialog } from "./admin-auth-dialog"
import { createProject } from "@/lib/actions/projects"
import { checkAdminAuth } from "@/lib/admin-auth"
import type { ProjectInsert } from "@/types/project"

export function AddProjectDialog() {
  const [open, setOpen] = useState(false)
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleOpenChange = async (newOpen: boolean) => {
    if (newOpen) {
      const isAuthenticated = await checkAdminAuth()
      if (isAuthenticated) {
        setOpen(true)
      } else {
        setIsAuthOpen(true)
      }
    } else {
      setOpen(false)
    }
  }

  const handleAuthSuccess = () => {
    setOpen(true)
  }

  const handleSubmit = async (data: ProjectInsert) => {
    setIsLoading(true)
    try {
      await createProject(data)
      setOpen(false)
    } catch (error) {
      console.error("Failed to create project:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Project
          </Button>
        </DialogTrigger>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Project</DialogTitle>
            <DialogDescription>Share details about your maker project</DialogDescription>
          </DialogHeader>
          <ProjectForm onSubmit={handleSubmit} onCancel={() => setOpen(false)} isLoading={isLoading} />
        </DialogContent>
      </Dialog>

      <AdminAuthDialog open={isAuthOpen} onOpenChange={setIsAuthOpen} onAuthenticated={handleAuthSuccess} />
    </>
  )
}

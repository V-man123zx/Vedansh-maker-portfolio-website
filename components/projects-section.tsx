"use client"

import { useState, useMemo, useCallback } from "react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { CategoryTabs } from "./category-tabs"
import { ProjectCard } from "./project-card"
import { AddProjectDialog } from "./add-project-dialog"
import { Button } from "@/components/ui/button"
import { FolderOpen, GripVertical, Check, X } from "lucide-react"
import { reorderProjects } from "@/lib/actions/projects"
import { checkAdminAuth } from "@/lib/admin-auth"
import { AdminAuthDialog } from "./admin-auth-dialog"
import type { Project } from "@/types/project"

function SortableProjectCard({ project }: { project: Project }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <ProjectCard
      project={project}
      isReordering
      sortableProps={{
        ref: setNodeRef,
        style,
        attributes: attributes as Record<string, unknown>,
        listeners: listeners as Record<string, unknown> | undefined,
        isDragging,
      }}
    />
  )
}

interface ProjectsSectionProps {
  initialProjects: Project[]
}

export function ProjectsSection({ initialProjects }: ProjectsSectionProps) {
  const [activeCategory, setActiveCategory] = useState("all")
  const [isReordering, setIsReordering] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [localProjects, setLocalProjects] = useState<Project[]>(initialProjects)
  const [isAuthOpen, setIsAuthOpen] = useState(false)

  // Keep localProjects in sync when initialProjects changes (e.g. after add/edit/delete)
  const projectsKey = initialProjects.map((p) => p.id).join(",")
  const [prevKey, setPrevKey] = useState(projectsKey)
  if (projectsKey !== prevKey) {
    setLocalProjects(initialProjects)
    setPrevKey(projectsKey)
    if (isReordering) setIsReordering(false)
  }

  const categories = useMemo(() => {
    const cats = [...new Set(localProjects.map((p) => p.category))]
    return cats.sort()
  }, [localProjects])

  const filteredProjects = useMemo(() => {
    if (activeCategory === "all") return localProjects
    return localProjects.filter((p) => p.category === activeCategory)
  }, [localProjects, activeCategory])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return

      setLocalProjects((prev) => {
        const oldIndex = prev.findIndex((p) => p.id === active.id)
        const newIndex = prev.findIndex((p) => p.id === over.id)
        if (oldIndex === -1 || newIndex === -1) return prev
        return arrayMove(prev, oldIndex, newIndex)
      })
    },
    []
  )

  const handleStartReorder = async () => {
    const isAuthenticated = await checkAdminAuth()
    if (isAuthenticated) {
      setActiveCategory("all")
      setIsReordering(true)
    } else {
      setIsAuthOpen(true)
    }
  }

  const handleAuthSuccess = () => {
    setActiveCategory("all")
    setIsReordering(true)
  }

  const handleSaveOrder = async () => {
    setIsSaving(true)
    try {
      await reorderProjects(localProjects.map((p) => p.id))
      setIsReordering(false)
    } catch (error) {
      console.error("Failed to save order:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancelReorder = () => {
    setLocalProjects(initialProjects)
    setIsReordering(false)
  }

  return (
    <section className="px-6 py-12">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Projects</h2>
            <p className="text-muted-foreground">
              {initialProjects.length} project
              {initialProjects.length !== 1 ? "s" : ""} in total
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isReordering ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelReorder}
                  disabled={isSaving}
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveOrder}
                  disabled={isSaving}
                >
                  <Check className="mr-2 h-4 w-4" />
                  {isSaving ? "Saving..." : "Save Order"}
                </Button>
              </>
            ) : (
              <>
                {localProjects.length > 1 && (
                  <Button variant="outline" size="sm" onClick={handleStartReorder}>
                    <GripVertical className="mr-2 h-4 w-4" />
                    Reorder
                  </Button>
                )}
                <AddProjectDialog />
              </>
            )}
          </div>
        </div>

        {!isReordering && categories.length > 0 && (
          <div className="mb-8">
            <CategoryTabs
              categories={categories}
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
            />
          </div>
        )}

        {isReordering && (
          <div className="mb-6 rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm text-primary">
            Drag and drop the project cards to rearrange their display order. Click &quot;Save Order&quot; when done.
          </div>
        )}

        {filteredProjects.length > 0 ? (
          isReordering ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={filteredProjects.map((p) => p.id)}
                strategy={rectSortingStrategy}
              >
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredProjects.map((project) => (
                    <SortableProjectCard key={project.id} project={project} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16">
            <FolderOpen className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-medium text-foreground">No projects yet</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              {activeCategory === "all"
                ? "Add your first project to get started"
                : `No projects in ${activeCategory} category`}
            </p>
            {activeCategory !== "all" && (
              <button onClick={() => setActiveCategory("all")} className="text-sm text-primary hover:underline">
                View all projects
              </button>
            )}
          </div>
        )}
      </div>

      <AdminAuthDialog open={isAuthOpen} onOpenChange={setIsAuthOpen} onAuthenticated={handleAuthSuccess} />
    </section>
  )
}

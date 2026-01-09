"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { ProjectInsert, ProjectUpdate } from "@/types/project"

export async function getProjects() {
  const supabase = await createClient()
  const { data, error } = await supabase.from("projects").select("*").order("created_at", { ascending: false })

  if (error) throw error
  return data
}

export async function getProjectsByCategory(category: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("category", category)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data
}

export async function getProject(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.from("projects").select("*").eq("id", id).single()

  if (error) throw error
  return data
}

export async function createProject(project: ProjectInsert) {
  const supabase = await createClient()
  const { data, error } = await supabase.from("projects").insert(project).select().single()

  if (error) throw error
  revalidatePath("/")
  return data
}

export async function updateProject(id: string, project: ProjectUpdate) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("projects")
    .update({ ...project, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single()

  if (error) throw error
  revalidatePath("/")
  return data
}

export async function deleteProject(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from("projects").delete().eq("id", id)

  if (error) throw error
  revalidatePath("/")
}

export async function getCategories() {
  const supabase = await createClient()
  const { data, error } = await supabase.from("projects").select("category").order("category")

  if (error) throw error
  const categories = [...new Set(data?.map((p) => p.category) || [])]
  return categories
}

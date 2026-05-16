"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { ProjectInsert, ProjectUpdate } from "@/types/project"

export async function getProjects() {
  const supabase = await createClient()
  
  console.log("[v0] Fetching projects from Supabase...")
  console.log("[v0] SUPABASE_URL set:", !!process.env.NEXT_PUBLIC_SUPABASE_URL)
  console.log("[v0] SUPABASE_ANON_KEY set:", !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  console.log("[v0] SUPABASE_URL value:", process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + "...")
  
  const { data, error } = await supabase.from("projects").select("*").order("created_at", { ascending: false })

  if (error) {
    console.error("[v0] Supabase error:", JSON.stringify(error))
    throw error
  }
  
  console.log("[v0] Projects fetched successfully, count:", data?.length ?? 0)
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
  const { data, error } = await supabase
    .from("projects")
    .insert({
      ...project,
      created_at: project.created_at || new Date().toISOString(),
    })
    .select()
    .single()

  if (error) throw error
  revalidatePath("/")
  return data
}

export async function updateProject(id: string, project: ProjectUpdate) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("projects")
    .update({
      ...project,
      updated_at: new Date().toISOString(),
    })
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

"use server"

import { cookies } from "next/headers"

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "maker2024"
const ADMIN_COOKIE_NAME = "admin_authenticated"

export async function verifyAdminPassword(password: string): Promise<boolean> {
  if (password === ADMIN_PASSWORD) {
    const cookieStore = await cookies()
    cookieStore.set(ADMIN_COOKIE_NAME, "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
    })
    return true
  }
  return false
}

export async function checkAdminAuth(): Promise<boolean> {
  const cookieStore = await cookies()
  return cookieStore.get(ADMIN_COOKIE_NAME)?.value === "true"
}

export async function logoutAdmin(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(ADMIN_COOKIE_NAME)
}

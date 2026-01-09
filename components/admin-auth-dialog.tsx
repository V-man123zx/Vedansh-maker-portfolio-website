"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Lock, AlertCircle } from "lucide-react"
import { verifyAdminPassword } from "@/lib/admin-auth"

interface AdminAuthDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAuthenticated: () => void
}

export function AdminAuthDialog({ open, onOpenChange, onAuthenticated }: AdminAuthDialogProps) {
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const isValid = await verifyAdminPassword(password)
      if (isValid) {
        setPassword("")
        onOpenChange(false)
        onAuthenticated()
      } else {
        setError("Invalid password")
      }
    } catch {
      setError("Authentication failed")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Admin Access Required
          </DialogTitle>
          <DialogDescription>Enter the admin password to add, edit, or delete projects.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              autoFocus
            />
          </div>
          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !password}>
              {isLoading ? "Verifying..." : "Unlock"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

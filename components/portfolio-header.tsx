import { Wrench, Github, Linkedin, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"

export function PortfolioHeader() {
  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <Wrench className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Vedansh's Maker Portfolio</h1>
            <p className="text-xs text-muted-foreground">cool stuff </p>
          </div>
        </div>

        <nav className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <a href="https://github.com/V-man123zx" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
              <Github className="h-5 w-5" />
            </a>
          </Button>
          <Button variant="ghost" size="icon" asChild>
            <a
              href="https://www.linkedin.com/in/vedanshw/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
            >
              <Linkedin className="h-5 w-5" />
            </a>
          </Button>
          <Button variant="ghost" size="icon" asChild>
            <a href="mailto:vedansh.wadhwani@gmail.com" aria-label="Email">
              <Mail className="h-5 w-5" />
            </a>
          </Button>

          <div className="ml-2 h-9 w-9 overflow-hidden rounded-full border-2 border-primary/20">
            <Image
              src="/images/img-6439.jpeg"
              alt="Profile"
              width={36}
              height={36}
              className="h-full w-full object-cover"
            />
          </div>
        </nav>
      </div>
    </header>
  )
}

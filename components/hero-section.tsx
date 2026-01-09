import Image from "next/image"

export function HeroSection() {
  return (
    <section className="border-b border-border bg-gradient-to-b from-muted/50 to-background px-6 py-16">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col-reverse items-center gap-8 md:flex-row md:justify-between">
          <div className="max-w-2xl text-center md:text-left">
            <p className="mb-2 text-sm font-medium uppercase tracking-wider text-muted-foreground">Engineer & Maker</p>
            <h2 className="mb-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl text-balance">
              Building things to learn
            </h2>
            <p className="text-lg leading-relaxed text-muted-foreground text-pretty">
              I design and build hardware, software, and everything in between. From electronics to mechanical systems,
              I love solving complex problems and learning new skills through hands-on engineering.
            </p>
          </div>

          <div className="relative flex-shrink-0">
            <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-primary to-primary/50 opacity-75 blur-sm" />
            <div className="relative h-48 w-48 overflow-hidden rounded-full border-4 border-background shadow-xl sm:h-64 sm:w-64">
              <Image src="/images/img-6439.jpeg" alt="Profile photo" fill className="object-cover" priority />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

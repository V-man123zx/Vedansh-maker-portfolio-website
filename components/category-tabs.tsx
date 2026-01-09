"use client"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface CategoryTabsProps {
  categories: string[]
  activeCategory: string
  onCategoryChange: (category: string) => void
}

export function CategoryTabs({ categories, activeCategory, onCategoryChange }: CategoryTabsProps) {
  return (
    <Tabs value={activeCategory} onValueChange={onCategoryChange}>
      <TabsList className="flex h-auto flex-wrap justify-start gap-1 bg-transparent p-0">
        <TabsTrigger
          value="all"
          className="rounded-full border border-transparent px-4 py-2 data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
        >
          All Projects
        </TabsTrigger>
        {categories.map((category) => (
          <TabsTrigger
            key={category}
            value={category}
            className="rounded-full border border-transparent px-4 py-2 data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            {category}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}

import { redirect } from "next/navigation"

import { getAuthenticatedUser } from "@/lib/services/auth.service"
import { getCategoriesWithStats } from "@/lib/services/category.service"
import { createMetadata } from "@/lib/seo"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { BookOpen, Tag } from "lucide-react"

import { CategoryForm } from "./_components/category-form"
import { CategoryList } from "./_components/category-list"

export const metadata = createMetadata({
  title: "Categories",
  description: "Organize income and expenses with custom categories.",
  canonical: "/categories",
})

const systemCategories = [
  {
    id: "system-transfer",
    name: "Transfer",
    description: "Used for internal transfers between accounts.",
  },
  {
    id: "system-initial",
    name: "Initial Balance",
    description: "Represents starting balances when accounts are created.",
  },
]

export default async function CategoriesPage() {
  const user = await getAuthenticatedUser()
  if (!user) {
    redirect("/sign-in")
  }

  const categories = await getCategoriesWithStats(user.id)

  const hasCategories = categories.length > 0

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Categories</h1>
          <p className="text-muted-foreground text-sm">
            Organize transactions with custom income and expense categories.
          </p>
        </div>
        <CategoryForm trigger={<Button size="sm">New Category</Button>} />
      </header>

      {!hasCategories && (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
            <span className="bg-muted flex size-12 items-center justify-center rounded-full">
              <Tag className="h-5 w-5 text-muted-foreground" />
            </span>
            <div className="space-y-1">
              <p className="text-base font-medium">Add your first category</p>
              <p className="text-sm text-muted-foreground">
                Create categories to keep your spending organized.
              </p>
            </div>
            <CategoryForm
              trigger={<Button variant="outline">Create Category</Button>}
            />
          </CardContent>
        </Card>
      )}

      {hasCategories && <CategoryList categories={categories} />}

      <Alert>
        <BookOpen className="h-4 w-4" />
        <AlertTitle>System categories</AlertTitle>
        <AlertDescription>
          These categories are managed automatically and cannot be edited.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {systemCategories.map((category) => (
          <Card key={category.id}>
            <CardContent className="space-y-2 p-4">
              <p className="text-sm font-semibold">{category.name}</p>
              <p className="text-xs text-muted-foreground">
                {category.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

"use client"

import { CategoryCard } from "./category-card"

type CategoryListProps = {
  categories: Array<{
    id: string
    name: string
    type: "INCOME" | "EXPENSE"
    color: string
    icon: string
    transactionCount: number
    monthlySpend: string
  }>
  userId: string
  currency?: string
}

export function CategoryList({
  categories,
  userId,
  currency,
}: CategoryListProps) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {categories.map((category) => (
        <CategoryCard
          key={category.id}
          category={category}
          userId={userId}
          currency={currency}
        />
      ))}
    </div>
  )
}

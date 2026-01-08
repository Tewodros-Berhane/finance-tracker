"use client"

import { Pie, PieChart, Cell } from "recharts"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

type CategoryDatum = {
  category: string
  value: number
}

const chartConfig = {
  value: {
    label: "Spend",
  },
} satisfies ChartConfig

const chartColors = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
]

type CategoryBreakdownProps = {
  data: CategoryDatum[]
  currency?: string
}

const formatCurrency = (value: number, currency: string) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value)

export function CategoryBreakdown({
  data,
  currency = "USD",
}: CategoryBreakdownProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0)

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-semibold">
          Expense categories
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-[minmax(0,1fr)_200px] md:items-center">
        <ChartContainer
          config={chartConfig}
          className="aspect-square max-h-[260px] w-full"
        >
          <PieChart>
            <ChartTooltip
              content={<ChartTooltipContent nameKey="category" />}
            />
            <Pie
              data={data}
              dataKey="value"
              nameKey="category"
              innerRadius={60}
              outerRadius={100}
              strokeWidth={2}
            >
              {data.map((entry, index) => (
                <Cell
                  key={entry.category}
                  fill={chartColors[index % chartColors.length]}
                />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
        <div className="space-y-4">
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-wide">
              Total spend
            </p>
            <p className="text-xl font-semibold">
              {formatCurrency(total, currency)}
            </p>
          </div>
          <div className="space-y-3">
            {data.map((item, index) => (
              <div
                key={item.category}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="size-2.5 rounded-full"
                    style={{
                      backgroundColor:
                        chartColors[index % chartColors.length],
                    }}
                  />
                  <span>{item.category}</span>
                </div>
                <span className="text-muted-foreground">
                  {formatCurrency(item.value, currency)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}


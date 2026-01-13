import { Wallet } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { formatCurrency } from "@/lib/format"

type NetWorthCardProps = {
  total: string
  currency?: string
}

export function NetWorthCard({ total, currency = "USD" }: NetWorthCardProps) {
  return (
    <Card className="border-border/60 bg-linear-to-br from-background via-background to-muted/30">
      <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            Total Net Worth
          </p>
          <div className="text-3xl font-semibold tracking-tight">
            {formatCurrency(total, currency)}
          </div>
          <p className="text-xs text-muted-foreground">
            Primary currency: {currency}
          </p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Wallet className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  )
}

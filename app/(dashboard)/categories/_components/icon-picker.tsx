"use client"

import {
  Car,
  CreditCard,
  Gift,
  Home,
  Plane,
  Receipt,
  ShoppingBag,
  Tag,
  TrainFront,
  Utensils,
  Wallet,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

export const iconMap = {
  shopping: ShoppingBag,
  food: Utensils,
  dining: Utensils,
  car: Car,
  transport: TrainFront,
  travel: Plane,
  home: Home,
  rent: Home,
  wallet: Wallet,
  card: CreditCard,
  gift: Gift,
  receipt: Receipt,
  tag: Tag,
} as const

export type CategoryIcon = keyof typeof iconMap

export const iconOptions = Object.keys(iconMap) as CategoryIcon[]

type IconPickerProps = {
  value: CategoryIcon
  onChange: (value: CategoryIcon) => void
}

export function IconPicker({ value, onChange }: IconPickerProps) {
  return (
    <ScrollArea className="h-40 w-full rounded-md border">
      <div className="grid grid-cols-6 gap-2 p-3">
        {Object.entries(iconMap).map(([key, Icon]) => {
          const isActive = value === key
          return (
            <Button
              key={key}
              type="button"
              variant={isActive ? "default" : "outline"}
              size="icon"
              className={cn("h-9 w-9", isActive && "shadow-sm")}
              onClick={() => onChange(key as CategoryIcon)}
            >
              <Icon className="h-4 w-4" />
            </Button>
          )
        })}
      </div>
    </ScrollArea>
  )
}

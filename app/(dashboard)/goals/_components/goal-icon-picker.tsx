"use client"

import {
  Car,
  Home,
  Plane,
  Target,
  Trophy,
  Wallet,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const iconMap = {
  trophy: Trophy,
  target: Target,
  plane: Plane,
  car: Car,
  home: Home,
  wallet: Wallet,
} as const

export type GoalIcon = keyof typeof iconMap

type GoalIconPickerProps = {
  value: GoalIcon
  onChange: (value: GoalIcon) => void
}

export function GoalIconPicker({ value, onChange }: GoalIconPickerProps) {
  return (
    <div className="grid grid-cols-6 gap-2">
      {Object.entries(iconMap).map(([key, Icon]) => {
        const isActive = value === key
        return (
          <Button
            key={key}
            type="button"
            size="icon"
            variant={isActive ? "default" : "outline"}
            className={cn("h-9 w-9", isActive && "shadow-sm")}
            onClick={() => onChange(key as GoalIcon)}
          >
            <Icon className="h-4 w-4" />
          </Button>
        )
      })}
    </div>
  )
}

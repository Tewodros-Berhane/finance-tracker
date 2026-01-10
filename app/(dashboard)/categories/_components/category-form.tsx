"use client"

import type { ReactNode } from "react"
import { useActionState, useEffect, useMemo, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Plus } from "lucide-react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import {
  upsertCategory,
  type CategoryActionState,
} from "@/lib/actions/category.actions"
import { upsertCategorySchema } from "@/lib/actions/category.schema"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

import { IconPicker, iconOptions, type CategoryIcon } from "./icon-picker"

const categorySchema = upsertCategorySchema.omit({ userId: true })

type CategoryValues = z.infer<typeof categorySchema>

type CategoryFormProps = {
  userId: string
  trigger?: ReactNode
  initialData?: {
    id: string
    name: string
    type: "INCOME" | "EXPENSE"
    icon: string
    color: string
  }
}

const colorOptions = [
  "#10b981",
  "#f97316",
  "#f43f5e",
  "#0ea5e9",
  "#8b5cf6",
  "#facc15",
  "#22c55e",
  "#64748b",
]

const initialState: CategoryActionState = {
  success: false,
  data: null,
  error: null,
}

export function CategoryForm({
  userId,
  trigger,
  initialData,
}: CategoryFormProps) {
  const [open, setOpen] = useState(false)
  const [state, formAction, isPending] = useActionState<
    CategoryActionState,
    CategoryValues & { userId: string }
  >((_, payload) => upsertCategory(payload), initialState)

  const form = useForm<CategoryValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      id: initialData?.id,
      name: initialData?.name ?? "",
      type: initialData?.type ?? "EXPENSE",
      icon:
        initialData?.icon && iconOptions.includes(initialData.icon as CategoryIcon)
          ? (initialData.icon as CategoryIcon)
          : "tag",
      color: initialData?.color ?? colorOptions[0],
    },
  })

  const selectedColor = form.watch("color")
  const selectedIcon = form.watch("icon") as CategoryIcon

  useEffect(() => {
    if (state.error) {
      toast.error(state.error)
    }
  }, [state.error])

  useEffect(() => {
    if (state.success) {
      toast.success(initialData ? "Category updated." : "Category created.")
      form.reset()
      setOpen(false)
    }
  }, [form, initialData, state.success])

  const title = useMemo(
    () => (initialData ? "Edit category" : "Create category"),
    [initialData]
  )

  const handleSubmit = (values: CategoryValues) => {
    formAction({
      userId,
      ...values,
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            New Category
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Customize how you track transactions by category.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Groceries" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="INCOME">Income</SelectItem>
                          <SelectItem value="EXPENSE">Expense</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="color"
                render={() => (
                  <FormItem>
                    <FormLabel>Color</FormLabel>
                    <div className="flex flex-wrap gap-2">
                      {colorOptions.map((color) => (
                        <button
                          key={color}
                          type="button"
                          className={cn(
                            "h-7 w-7 rounded-full border",
                            selectedColor === color
                              ? "ring-2 ring-foreground"
                              : "ring-1 ring-border"
                          )}
                          style={{ backgroundColor: color }}
                          onClick={() => form.setValue("color", color)}
                        />
                      ))}
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="icon"
              render={() => (
                <FormItem>
                  <FormLabel>Icon</FormLabel>
                  <FormControl>
                    <IconPicker
                      value={selectedIcon}
                      onChange={(value) => form.setValue("icon", value)}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {initialData ? "Save changes" : "Create category"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

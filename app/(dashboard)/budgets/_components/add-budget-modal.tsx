"use client"

import type { ReactNode } from "react"
import { useActionState, useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Plus, Tag } from "lucide-react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import {
  upsertBudget,
  type BudgetActionState,
} from "@/lib/actions/budget.actions"
import { upsertBudgetSchema } from "@/lib/actions/budget.schema"
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

const budgetSchema = upsertBudgetSchema

type BudgetValues = z.infer<typeof budgetSchema>

type CategoryOption = {
  id: string
  name: string
  icon?: string | null
}

type AddBudgetModalProps = {
  categories: CategoryOption[]
  trigger?: ReactNode
  budget?: {
    categoryId: string
    amount: string
  }
  open?: boolean
  onOpenChange?: (open: boolean) => void
  showTrigger?: boolean
}

const initialState: BudgetActionState = {
  success: false,
  data: null,
  error: null,
}

export function AddBudgetModal({
  categories,
  trigger,
  budget,
  open,
  onOpenChange,
  showTrigger = true,
}: AddBudgetModalProps) {
  const router = useRouter()
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = open !== undefined
  const isOpen = isControlled ? open : internalOpen
  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (isControlled) {
        onOpenChange?.(nextOpen)
      } else {
        setInternalOpen(nextOpen)
      }
    },
    [isControlled, onOpenChange]
  )
  const isEdit = Boolean(budget)
  const defaultCategoryId = useMemo(
    () => budget?.categoryId ?? categories[0]?.id ?? "",
    [budget?.categoryId, categories]
  )
  const [state, formAction, isPending] = useActionState<
    BudgetActionState,
    BudgetValues
  >((_, payload) => upsertBudget(payload), initialState)

  const form = useForm<BudgetValues>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      categoryId: defaultCategoryId,
      amount: budget?.amount ?? "",
    },
  })

  useEffect(() => {
    if (state.error) {
      toast.error(state.error)
    }
  }, [state.error])

  useEffect(() => {
    if (state.success) {
      toast.success("Budget saved.")
      form.reset()
      handleOpenChange(false)
      router.refresh()
    }
  }, [form, handleOpenChange, router, state.success])

  useEffect(() => {
    if (!isOpen) return
    form.reset({
      categoryId: defaultCategoryId,
      amount: budget?.amount ?? "",
    })
  }, [budget?.amount, defaultCategoryId, form, isOpen])

  const handleSubmit = (values: BudgetValues) => {
    formAction({
      categoryId: values.categoryId,
      amount: values.amount.trim(),
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {showTrigger && (
        <DialogTrigger asChild>
          {trigger ?? (
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Budget
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit budget" : "Set a budget"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the monthly limit for this category."
              : "Assign a monthly limit to keep spending in check."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isEdit}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            <div className="flex items-center gap-2">
                              <Tag className="h-4 w-4" />
                              <span>{category.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monthly limit</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      inputMode="decimal"
                      placeholder="0.00"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEdit ? "Save changes" : "Save budget"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

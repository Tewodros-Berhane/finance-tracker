"use client"

import type { ReactNode } from "react"
import { useActionState, useEffect, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { Calendar as CalendarIcon, Loader2, Plus, Wallet } from "lucide-react"
import { useForm, type Resolver } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import {
  upsertGoal,
  type GoalActionState,
} from "@/lib/actions/goal.actions"
import { upsertGoalSchema } from "@/lib/actions/goal.schema"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

import { GoalIconPicker, type GoalIcon } from "./goal-icon-picker"

const goalSchema = upsertGoalSchema

type GoalValues = z.infer<typeof goalSchema>

type GoalFormProps = {
  trigger?: ReactNode
  initialData?: {
    id: string
    name: string
    targetAmount: string
    currentAmount: string
    deadline?: string | null
    financialAccountId?: string | null
    icon?: string
    color?: string
  }
}

type AccountOption = {
  id: string
  name: string
}

const colorOptions = [
  "#f59e0b",
  "#0ea5e9",
  "#22c55e",
  "#f97316",
  "#8b5cf6",
  "#64748b",
]

const initialState: GoalActionState = {
  success: false,
  data: null,
  error: null,
}

export function GoalForm({ trigger, initialData }: GoalFormProps) {
  const [open, setOpen] = useState(false)
  const [accounts, setAccounts] = useState<AccountOption[]>([])
  const [accountsLoading, setAccountsLoading] = useState(false)
  const [accountsRequested, setAccountsRequested] = useState(false)
  const [state, formAction, isPending] = useActionState<
    GoalActionState,
    GoalValues
  >((_, payload) => upsertGoal(payload), initialState)

  const form = useForm<GoalValues>({
    resolver: zodResolver(goalSchema) as Resolver<GoalValues>,
    defaultValues: {
      id: initialData?.id,
      name: initialData?.name ?? "",
      targetAmount: initialData?.targetAmount ?? "",
      currentAmount: initialData?.currentAmount ?? "0",
      deadline: initialData?.deadline ? new Date(initialData.deadline) : undefined,
      financialAccountId: initialData?.financialAccountId ?? "",
      icon: (initialData?.icon as GoalIcon) ?? "target",
      color: initialData?.color ?? colorOptions[0],
    },
  })

  const selectedColor = form.watch("color")
  const selectedIcon = form.watch("icon") as GoalIcon
  const selectedAccountId = form.watch("financialAccountId")

  useEffect(() => {
    if (state.error) {
      toast.error(state.error)
    }
  }, [state.error])

  useEffect(() => {
    if (state.success) {
      toast.success(initialData ? "Goal updated." : "Goal created.")
      form.reset()
      setOpen(false)
    }
  }, [form, initialData, state.success])

  useEffect(() => {
    if (!open) return

    const fetchAccounts = async () => {
      setAccountsLoading(true)
      try {
        const response = await fetch("/api/accounts")
        const payload = (await response.json()) as {
          success: boolean
          data?: Array<{ id: string; name: string }>
          error?: string | null
        }

        if (!response.ok || !payload.success) {
          throw new Error(payload.error ?? "Failed to load accounts.")
        }

        setAccounts(Array.isArray(payload.data) ? payload.data : [])
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to load accounts."
        toast.error(message)
      } finally {
        setAccountsLoading(false)
      }
    }

    if (!accountsRequested) {
      setAccountsRequested(true)
      fetchAccounts()
    }
  }, [accountsRequested, open])

  useEffect(() => {
    if (open) return
    setAccountsRequested(false)
  }, [open])

  useEffect(() => {
    if (!accounts.length) return
    const hasAccount = accounts.some(
      (account) => account.id === selectedAccountId
    )
    if (!selectedAccountId || !hasAccount) {
      form.setValue("financialAccountId", accounts[0]?.id ?? "")
    }
  }, [accounts, form, selectedAccountId])

  const handleSubmit = (values: GoalValues) => {
    formAction({
      ...values,
      targetAmount: values.targetAmount.trim(),
      currentAmount: values.currentAmount?.trim() ?? "0",
      financialAccountId: values.financialAccountId || undefined,
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            New Goal
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit goal" : "Create goal"}</DialogTitle>
          <DialogDescription>
            Set a savings target and track progress over time.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Goal name</FormLabel>
                  <FormControl>
                    <Input placeholder="New car fund" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="targetAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target amount</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        inputMode="decimal"
                        placeholder="5000"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="currentAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current amount</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        inputMode="decimal"
                        placeholder="0"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="financialAccountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Funding account</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select account" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.length ? (
                          accounts.map((account) => (
                            <SelectItem key={account.id} value={account.id}>
                              <div className="flex items-center gap-2">
                                <Wallet className="h-4 w-4" />
                                <span>{account.name}</span>
                              </div>
                            </SelectItem>
                          ))
                        ) : accountsLoading ? (
                          <SelectItem value="loading" disabled>
                            Loading accounts...
                          </SelectItem>
                        ) : (
                          <SelectItem value="empty" disabled>
                            No accounts available
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="deadline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deadline</FormLabel>
                  <FormControl>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start gap-2",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="h-4 w-4" />
                          {field.value ? format(field.value, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent align="start" className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(date) => field.onChange(date ?? undefined)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="icon"
                render={() => (
                  <FormItem>
                    <FormLabel>Icon</FormLabel>
                    <FormControl>
                      <GoalIconPicker
                        value={selectedIcon}
                        onChange={(value) => form.setValue("icon", value)}
                      />
                    </FormControl>
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
            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {initialData ? "Save changes" : "Create goal"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

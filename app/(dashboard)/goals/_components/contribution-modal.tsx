"use client"

import type { ReactNode } from "react"
import { useActionState, useEffect, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Plus, Wallet } from "lucide-react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import {
  updateGoalProgress,
  type GoalActionState,
} from "@/lib/actions/goal.actions"
import { updateGoalProgressSchema } from "@/lib/actions/goal.schema"
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

const contributionSchema = updateGoalProgressSchema.omit({ id: true })

type ContributionValues = z.infer<typeof contributionSchema>

type ContributionModalProps = {
  goalId: string
  trigger?: ReactNode
  defaultAccountId?: string | null
}

type AccountOption = {
  id: string
  name: string
}

const initialState: GoalActionState = {
  success: false,
  data: null,
  error: null,
}

export function ContributionModal({
  goalId,
  trigger,
  defaultAccountId,
}: ContributionModalProps) {
  const [open, setOpen] = useState(false)
  const [accounts, setAccounts] = useState<AccountOption[]>([])
  const [accountsLoading, setAccountsLoading] = useState(false)
  const [accountsRequested, setAccountsRequested] = useState(false)
  const [state, formAction, isPending] = useActionState<
    GoalActionState,
    ContributionValues & { id: string }
  >((_, payload) => updateGoalProgress(payload), initialState)

  const form = useForm<ContributionValues>({
    resolver: zodResolver(contributionSchema),
    defaultValues: {
      amount: "",
      financialAccountId: defaultAccountId ?? "",
    },
  })

  const selectedAccountId = form.watch("financialAccountId")

  useEffect(() => {
    if (state.error) {
      toast.error(state.error)
    }
  }, [state.error])

  useEffect(() => {
    if (state.success) {
      toast.success("Contribution added.")
      form.reset()
      setOpen(false)
    }
  }, [form, state.success])

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

  const handleSubmit = (values: ContributionValues) => {
    formAction({
      id: goalId,
      amount: values.amount.trim(),
      financialAccountId: values.financialAccountId,
    })
  }

  const isSubmitDisabled = isPending || accounts.length === 0

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            Add contribution
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[380px]">
        <DialogHeader>
          <DialogTitle>Add contribution</DialogTitle>
          <DialogDescription>
            Add money to this goal’s saved amount.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="financialAccountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account</FormLabel>
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
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
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
              <Button type="submit" disabled={isSubmitDisabled}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

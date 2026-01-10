"use client"

import type { ReactNode } from "react"
import { useActionState, useEffect, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Plus } from "lucide-react"
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

const contributionSchema = updateGoalProgressSchema.omit({ userId: true, id: true })

type ContributionValues = z.infer<typeof contributionSchema>

type ContributionModalProps = {
  userId: string
  goalId: string
  trigger?: ReactNode
}

const initialState: GoalActionState = {
  success: false,
  data: null,
  error: null,
}

export function ContributionModal({
  userId,
  goalId,
  trigger,
}: ContributionModalProps) {
  const [open, setOpen] = useState(false)
  const [state, formAction, isPending] = useActionState<
    GoalActionState,
    ContributionValues & { userId: string; id: string }
  >((_, payload) => updateGoalProgress(payload), initialState)

  const form = useForm<ContributionValues>({
    resolver: zodResolver(contributionSchema),
    defaultValues: {
      amount: "",
    },
  })

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

  const handleSubmit = (values: ContributionValues) => {
    formAction({
      userId,
      id: goalId,
      amount: values.amount.trim(),
    })
  }

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
              <Button type="submit" disabled={isPending}>
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

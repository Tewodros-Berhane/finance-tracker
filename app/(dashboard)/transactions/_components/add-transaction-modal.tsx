"use client"

import type { ReactNode } from "react"
import { useActionState, useEffect, useMemo, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { Calendar as CalendarIcon, Loader2, Plus, Tag, Wallet } from "lucide-react"
import { useRouter } from "next/navigation"
import { useForm, type Resolver } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import {
  createTransaction,
} from "@/lib/actions/transaction.actions"
import { createTransactionSchema } from "@/lib/actions/transaction.schema"
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
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

const transactionSchema = createTransactionSchema.omit({ userId: true })

type TransactionValues = z.infer<typeof transactionSchema>

type AccountOption = {
  id: string
  name: string
  currency?: string | null
}

type CategoryOption = {
  id: string
  name: string
  type: "INCOME" | "EXPENSE"
}

type AddTransactionModalProps = {
  userId: string
  accounts: AccountOption[]
  categories: CategoryOption[]
  trigger?: ReactNode
}

const currencySymbols: Record<string, string> = {
  USD: "$",
  EUR: "EUR",
  GBP: "GBP",
  JPY: "JPY",
}

const transactionTypes = [
  {
    value: "INCOME",
    label: "Income",
    className: "data-[state=active]:text-emerald-600",
  },
  {
    value: "EXPENSE",
    label: "Expense",
    className: "data-[state=active]:text-rose-600",
  },
  {
    value: "TRANSFER",
    label: "Transfer",
    className: "data-[state=active]:text-blue-600",
  },
] as const

type TransactionActionState = {
  success: boolean
  data: { id: string } | null
  error: string | null
}

type TransactionPayload = TransactionValues & { userId: string }

const initialState: TransactionActionState = {
  success: false,
  data: null,
  error: null,
}

export function AddTransactionTrigger() {
  return (
    <Button variant="outline" size="sm" className="gap-2">
      <Plus className="size-4" />
      Add Transaction
    </Button>
  )
}

export function AddTransactionModal({
  userId,
  accounts,
  categories,
  trigger,
}: AddTransactionModalProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [state, formAction, isPending] = useActionState<
    TransactionActionState,
    TransactionPayload
  >((_, payload) => createTransaction(payload), initialState)
  const form = useForm<TransactionValues>({
    resolver: zodResolver(transactionSchema) as Resolver<TransactionValues, any>,
    defaultValues: {
      type: "EXPENSE",
      amount: "",
      date: new Date(),
      financialAccountId: accounts[0]?.id ?? "",
      categoryId: undefined,
      description: "",
      isRecurring: false,
    },
  })

  const selectedType = form.watch("type")
  const selectedAccountId = form.watch("financialAccountId")
  const selectedAccount = accounts.find(
    (account) => account.id === selectedAccountId
  )
  const currencySymbol =
    currencySymbols[selectedAccount?.currency || "USD"] || "$"

  const filteredCategories = useMemo(() => {
    if (selectedType === "TRANSFER") {
      return []
    }

    return categories.filter((category) => category.type === selectedType)
  }, [categories, selectedType])

  useEffect(() => {
    if (selectedType === "TRANSFER") {
      form.setValue("categoryId", undefined)
    }
  }, [form, selectedType])

  useEffect(() => {
    if (state.error) {
      toast.error(state.error)
    }
  }, [state.error])

  useEffect(() => {
    if (state.success) {
      toast.success("Transaction added successfully!")
      setOpen(false)
      form.reset()
      router.refresh()
    }
  }, [form, router, state.success])

  const handleSubmit = (values: TransactionValues) => {
    formAction({
      userId,
      ...values,
      amount: values.amount.trim(),
      categoryId:
        selectedType === "TRANSFER" ? undefined : values.categoryId || undefined,
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? <AddTransactionTrigger />}
      </DialogTrigger>
      <DialogContent className="sm:max-w-130">
        <DialogHeader>
          <DialogTitle>Add transaction</DialogTitle>
          <DialogDescription>
            Capture income, expenses, or transfers in seconds.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="grid gap-4">
            <Tabs
              value={selectedType}
              onValueChange={(value) =>
                form.setValue("type", value as TransactionValues["type"])
              }
            >
              <TabsList className="grid w-full grid-cols-3">
                {transactionTypes.map((type) => (
                  <TabsTrigger
                    key={type.value}
                    value={type.value}
                    className={type.className}
                  >
                    {type.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg text-muted-foreground">
                        {currencySymbol}
                      </span>
                      <Input
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        className="pl-10 text-center text-2xl font-semibold"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="financialAccountId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select account" />
                        </SelectTrigger>
                        <SelectContent>
                          {accounts.map((account) => (
                            <SelectItem key={account.id} value={account.id}>
                              <div className="flex items-center gap-2">
                                <Wallet className="size-4" />
                                <span>{account.name}</span>
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
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value ?? ""}
                        onValueChange={field.onChange}
                        disabled={selectedType === "TRANSFER"}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue
                            placeholder={
                              selectedType === "TRANSFER"
                                ? "Not applicable"
                                : "Select category"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {filteredCategories.length ? (
                            filteredCategories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                <div className="flex items-center gap-2">
                                  <Tag className="size-4" />
                                  <span>{category.name}</span>
                                </div>
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="empty" disabled>
                              No categories
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start gap-2"
                        >
                          <CalendarIcon className="size-4" />
                          {field.value ? format(field.value, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent align="start" className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(date) => date && field.onChange(date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="Add a note" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isRecurring"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-1">
                    <FormLabel className="text-sm font-medium">
                      Is this a recurring transaction?
                    </FormLabel>
                    <p className="text-muted-foreground text-xs">
                      Automatically remind me each period.
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending && (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                )}
                Add transaction
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

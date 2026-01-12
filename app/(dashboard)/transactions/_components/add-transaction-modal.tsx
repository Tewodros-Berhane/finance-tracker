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

const transactionSchema = createTransactionSchema

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
  accounts?: AccountOption[]
  categories?: CategoryOption[]
  trigger?: ReactNode
}

const currencySymbols: Record<string, string> = {
  USD: "$",
  BIRR: "Br",
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
  accounts: accountsProp = [],
  categories: categoriesProp = [],
  trigger,
}: AddTransactionModalProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [accounts, setAccounts] = useState<AccountOption[]>(accountsProp)
  const [categories, setCategories] = useState<CategoryOption[]>(categoriesProp)
  const [accountsLoading, setAccountsLoading] = useState(false)
  const [categoriesLoading, setCategoriesLoading] = useState(false)
  const [accountsRequested, setAccountsRequested] = useState(false)
  const [categoriesRequested, setCategoriesRequested] = useState(false)
  const [state, formAction, isPending] = useActionState<
    TransactionActionState,
    TransactionValues
  >((_, payload) => createTransaction(payload), initialState)
  const form = useForm<TransactionValues>({
    resolver: zodResolver(transactionSchema) as Resolver<TransactionValues>,
    defaultValues: {
      type: "EXPENSE",
      amount: "",
      date: new Date(),
      financialAccountId: accounts[0]?.id ?? "",
      transferAccountId: "",
      categoryId: undefined,
      description: "",
      isRecurring: false,
    },
  })

  const selectedType = form.watch("type")
  const selectedAccountId = form.watch("financialAccountId")
  const selectedTransferAccountId = form.watch("transferAccountId")
  const selectedAccount = accounts.find(
    (account) => account.id === selectedAccountId
  )
  const currencySymbol =
    currencySymbols[selectedAccount?.currency || "USD"] || "$"
  const availableTransferAccounts = useMemo(
    () => accounts.filter((account) => account.id !== selectedAccountId),
    [accounts, selectedAccountId]
  )

  const filteredCategories = useMemo(() => {
    if (selectedType !== "EXPENSE") {
      return []
    }

    return categories.filter((category) => category.type === "EXPENSE")
  }, [categories, selectedType])

  useEffect(() => {
    if (accountsProp.length) {
      setAccounts(accountsProp)
    }
  }, [accountsProp])

  useEffect(() => {
    if (categoriesProp.length) {
      setCategories(categoriesProp)
    }
  }, [categoriesProp])

  useEffect(() => {
    if (!open) return

    const fetchAccounts = async () => {
      setAccountsLoading(true)
      try {
        const response = await fetch("/api/accounts")
        const payload = (await response.json()) as {
          success: boolean
          data?: Array<{ id: string; name: string; currency?: string | null }>
          error?: string | null
        }

        if (!response.ok || !payload.success) {
          throw new Error(payload.error ?? "Failed to load accounts.")
        }

        const nextAccounts = Array.isArray(payload.data)
          ? payload.data.map((account) => ({
              id: account.id,
              name: account.name,
              currency: account.currency ?? "USD",
            }))
          : []

        setAccounts(nextAccounts)
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to load accounts."
        toast.error(message)
      } finally {
        setAccountsLoading(false)
      }
    }

    const fetchCategories = async () => {
      setCategoriesLoading(true)
      try {
        const response = await fetch("/api/categories")
        const payload = (await response.json()) as {
          success: boolean
          data?: Array<{ id: string; name: string; type: "INCOME" | "EXPENSE" }>
          error?: string | null
        }

        if (!response.ok || !payload.success) {
          throw new Error(payload.error ?? "Failed to load categories.")
        }

        setCategories(Array.isArray(payload.data) ? payload.data : [])
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to load categories."
        toast.error(message)
      } finally {
        setCategoriesLoading(false)
      }
    }

    if (!accountsLoading && !accountsRequested) {
      setAccountsRequested(true)
      fetchAccounts()
    }

    if (!categoriesLoading && !categoriesRequested) {
      setCategoriesRequested(true)
      fetchCategories()
    }
  }, [
    accountsLoading,
    accountsRequested,
    categoriesLoading,
    categoriesRequested,
    open,
  ])

  useEffect(() => {
    if (open) return
    setAccountsRequested(false)
    setCategoriesRequested(false)
  }, [open])

  useEffect(() => {
    const currentAccountId = form.getValues("financialAccountId")
    const hasAccount = accounts.some((account) => account.id === currentAccountId)

    if (!hasAccount) {
      form.setValue("financialAccountId", accounts[0]?.id ?? "")
    }
  }, [accounts, form])

  useEffect(() => {
    if (selectedType !== "TRANSFER") {
      form.setValue("transferAccountId", undefined)
      return
    }

    const hasTransferAccount = availableTransferAccounts.some(
      (account) => account.id === selectedTransferAccountId
    )

    if (!hasTransferAccount) {
      form.setValue("transferAccountId", availableTransferAccounts[0]?.id ?? "")
    }
  }, [
    availableTransferAccounts,
    form,
    selectedTransferAccountId,
    selectedType,
  ])

  useEffect(() => {
    if (selectedType !== "EXPENSE") {
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
      ...values,
      amount: values.amount.trim(),
      categoryId: selectedType === "EXPENSE" ? values.categoryId || undefined : undefined,
      transferAccountId:
        selectedType === "TRANSFER" ? values.transferAccountId || undefined : undefined,
    })
  }

  const isSubmitDisabled =
    isPending ||
    accounts.length === 0 ||
    (selectedType === "TRANSFER" &&
      (!selectedTransferAccountId ||
        selectedTransferAccountId === selectedAccountId ||
        availableTransferAccounts.length === 0))

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

            {selectedType === "TRANSFER" ? (
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="financialAccountId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>From account</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select account" />
                          </SelectTrigger>
                          <SelectContent>
                            {accounts.length ? (
                              accounts.map((account) => (
                                <SelectItem key={account.id} value={account.id}>
                                  <div className="flex items-center gap-2">
                                    <Wallet className="size-4" />
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
                  name="transferAccountId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>To account</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value ?? ""}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select account" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableTransferAccounts.length ? (
                              availableTransferAccounts.map((account) => (
                                <SelectItem key={account.id} value={account.id}>
                                  <div className="flex items-center gap-2">
                                    <Wallet className="size-4" />
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
                                No destination accounts
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
            ) : (
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
                            {accounts.length ? (
                              accounts.map((account) => (
                                <SelectItem key={account.id} value={account.id}>
                                  <div className="flex items-center gap-2">
                                    <Wallet className="size-4" />
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
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value ?? ""}
                          onValueChange={field.onChange}
                          disabled={selectedType !== "EXPENSE"}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue
                              placeholder={
                                selectedType !== "EXPENSE"
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
                            ) : categoriesLoading ? (
                              <SelectItem value="loading" disabled>
                                Loading categories...
                              </SelectItem>
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
            )}

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
              <Button type="submit" disabled={isSubmitDisabled}>
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

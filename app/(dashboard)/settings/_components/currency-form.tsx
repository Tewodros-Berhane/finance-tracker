"use client"

import { useActionState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Coins, Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import {
  updateCurrencySettings,
  type ActionResponse,
} from "@/lib/actions/user.actions"
import { updateCurrencySettingsSchema } from "@/lib/actions/user.schema"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type CurrencyFormProps = {
  baseCurrency: "USD" | "BIRR"
  exchangeRate: string
}

type CurrencyValues = z.infer<typeof updateCurrencySettingsSchema>
type CurrencyActionState = ActionResponse<{ id: string }>

const initialState: CurrencyActionState = {
  success: false,
  data: null,
  error: null,
}

export function CurrencyForm({
  baseCurrency,
  exchangeRate,
}: CurrencyFormProps) {
  const [state, formAction, isPending] = useActionState<
    CurrencyActionState,
    CurrencyValues
  >((_, payload) => updateCurrencySettings(payload), initialState)
  const form = useForm<CurrencyValues>({
    resolver: zodResolver(updateCurrencySettingsSchema),
    defaultValues: {
      baseCurrency,
      exchangeRate,
    },
  })

  useEffect(() => {
    if (state.error) {
      toast.error(state.error)
    }
  }, [state.error])

  useEffect(() => {
    if (state.success) {
      toast.success("Currency settings updated.")
    }
  }, [state.success])

  const handleSubmit = (values: CurrencyValues) => {
    formAction({
      baseCurrency: values.baseCurrency,
      exchangeRate: values.exchangeRate.trim(),
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Coins className="size-4" />
          Base Currency & Exchange Rate
        </CardTitle>
        <CardDescription>
          Control how multi-currency totals are displayed across Vantage.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="baseCurrency"
              render={({ field }) => (
                <FormItem>
                  <Label>Base Currency</Label>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="BIRR">BIRR (Br)</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="exchangeRate"
              render={({ field }) => (
                <FormItem>
                  <Label htmlFor="settings-rate">Exchange Rate</Label>
                  <FormControl>
                    <Input
                      id="settings-rate"
                      inputMode="decimal"
                      placeholder="120"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <p className="text-muted-foreground text-sm">
              The exchange rate is used to convert account balances into your
              chosen Base Currency for dashboard analytics.
            </p>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Save currency settings
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

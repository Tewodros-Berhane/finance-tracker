"use client"

import { useActionState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, User } from "lucide-react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { updateProfile, type ActionResponse } from "@/lib/actions/user.actions"
import { updateProfileSchema } from "@/lib/actions/user.schema"
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

type ProfileFormProps = {
  name: string
  email: string
}

type ProfileValues = z.infer<typeof updateProfileSchema>
type ProfileActionState = ActionResponse<{ id: string }>

const initialState: ProfileActionState = {
  success: false,
  data: null,
  error: null,
}

export function ProfileForm({ name, email }: ProfileFormProps) {
  const [state, formAction, isPending] = useActionState<
    ProfileActionState,
    ProfileValues
  >((_, payload) => updateProfile(payload), initialState)
  const form = useForm<ProfileValues>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name,
      email,
    },
  })

  useEffect(() => {
    if (state.error) {
      toast.error(state.error)
    }
  }, [state.error])

  useEffect(() => {
    if (state.success) {
      toast.success("Profile updated.")
    }
  }, [state.success])

  const handleSubmit = (values: ProfileValues) => {
    formAction({
      name: values.name.trim(),
      email: values.email.trim(),
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <User className="size-4" />
          Personal Information
        </CardTitle>
        <CardDescription>
          Keep your profile details up to date.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <Label htmlFor="settings-name">Name</Label>
                  <FormControl>
                    <Input id="settings-name" placeholder="Your name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <Label htmlFor="settings-email">Email</Label>
                  <FormControl>
                    <Input
                      id="settings-email"
                      type="email"
                      placeholder="you@example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Save changes
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

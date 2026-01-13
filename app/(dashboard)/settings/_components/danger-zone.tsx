"use client"

import { useActionState, useEffect, useState } from "react"
import { Loader2, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { deleteAccount, type ActionResponse } from "@/lib/actions/user.actions"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

type DeleteActionState = ActionResponse<{ id: string }>

const initialState: DeleteActionState = {
  success: false,
  data: null,
  error: null,
}

export function DangerZone() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [state, formAction, isPending] = useActionState<
    DeleteActionState,
    void
  >((currentState) => deleteAccount(currentState), initialState)

  useEffect(() => {
    if (state.error) {
      toast.error(state.error)
    }
  }, [state.error])

  useEffect(() => {
    if (state.success) {
      toast.success("Account deleted.")
      setOpen(false)
      router.push("/sign-in")
      router.refresh()
    }
  }, [router, state.success])

  const handleDelete = () => {
    formAction()
  }

  return (
    <Card className="border-destructive/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-destructive">
          <Trash2 className="size-4" />
          Danger Zone
        </CardTitle>
        <CardDescription>
          Deleting your account removes all data permanently.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AlertDialog open={open} onOpenChange={setOpen}>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">Delete Account</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete account?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. All of your accounts,
                transactions, budgets, and goals will be permanently removed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction asChild>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isPending}
                >
                  {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                  Delete Account
                </Button>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  )
}

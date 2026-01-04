import Link from "next/link"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { SignInForm } from "./sign-in-form"

export default function SignInPage() {
  return (
    <div className="min-h-screen w-full px-4 py-10 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Sign in</CardTitle>
          <CardDescription>Continue to Vantage</CardDescription>
        </CardHeader>
        <CardContent>
          <SignInForm />
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-gray-400 px-2">Don&apos;t have an account?</p>
          <Button asChild variant="link" className="px-0">
            <Link href="/sign-up">Sign up</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}


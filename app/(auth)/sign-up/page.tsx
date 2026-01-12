import Link from "next/link"
import { createMetadata } from "@/lib/seo"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { SignUpForm } from "./sign-up-form"

export const metadata = createMetadata({
  title: "Sign up",
  description: "Create your Vantage account to start tracking your finances.",
  canonical: "/sign-up",
  noIndex: true,
})

export default function SignUpPage() {
  return (
    <div className="min-h-screen w-full px-4 py-10 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Create your account</CardTitle>
          <CardDescription>
            Start tracking your finances with Vantage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SignUpForm />
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-gray-400 px-2"> Already have an account? </p>
          <Button asChild variant="link" className="px-0">
            <Link href="/sign-in">Sign in</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

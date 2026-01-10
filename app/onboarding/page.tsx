import { OnboardingForm } from "./_components/onboarding-form"

export default function OnboardingPage() {
  const userId = "demo-user"
  return (
    <div className="bg-background flex min-h-screen items-center justify-center px-4 py-12">
      <div className="flex w-full max-w-2xl flex-col items-center gap-6 text-center">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">
            Welcome to Vantage
          </h1>
          <p className="text-muted-foreground text-sm">
            Let&apos;s set up your first financial account to get started.
          </p>
        </div>
        <OnboardingForm userId={userId} />
      </div>
    </div>
  )
}

import { Suspense } from "react"
import { redirect } from "next/navigation"

import { getAuthenticatedUser } from "@/lib/services/auth.service"
import { getUserSettings } from "@/lib/services/user.service"
import { createMetadata } from "@/lib/seo"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"

import { ProfileForm } from "./_components/profile-form"
import { CurrencyForm } from "./_components/currency-form"
import { DangerZone } from "./_components/danger-zone"

export const metadata = createMetadata({
  title: "Settings",
  description: "Manage your profile, base currency, and account preferences.",
  canonical: "/settings",
})

function SettingsSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="space-y-6">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-2 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-2 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  )
}

async function SettingsContent() {
  const user = await getAuthenticatedUser()
  if (!user) {
    redirect("/sign-in")
  }

  const settings = await getUserSettings(user.id)
  if (!settings) {
    redirect("/sign-in")
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm">
          Manage your personal information and currency preferences.
        </p>
      </header>
      <div className="space-y-6">
        <ProfileForm name={settings.name} email={settings.email} />
        <Separator />
        <CurrencyForm
          baseCurrency={settings.baseCurrency}
          exchangeRate={settings.usdToBirrRate}
        />
        <Separator />
        <DangerZone />
      </div>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<SettingsSkeleton />}>
      <SettingsContent />
    </Suspense>
  )
}

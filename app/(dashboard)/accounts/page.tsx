import { Suspense } from "react";
import { redirect } from "next/navigation";

import { Prisma } from "@prisma/client";
import { getAuthenticatedUser } from "@/lib/services/auth.service";
import { getAccountsWithBalances } from "@/lib/services/account.service";
import { convertToBaseCurrency } from "@/lib/services/currency.service";
import { getUserCurrencySettings } from "@/lib/services/user.service";
import { createMetadata } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import { AddAccountModal } from "./_components/add-account-modal";
import { AccountCard } from "./_components/account-card";
import { NetWorthCard } from "./_components/net-worth-card";

export const metadata = createMetadata({
  title: "Accounts",
  description:
    "Monitor balances across your checking, savings, and credit accounts.",
  canonical: "/accounts",
});

function AccountsSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-32" />
      </div>
      <Skeleton className="h-28 w-full" />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
    </div>
  );
}

async function AccountsContent() {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect("/sign-in");
  }

  const [accounts, currencySettings] = await Promise.all([
    getAccountsWithBalances(user.id),
    getUserCurrencySettings(user.id),
  ]);

  const totalNetWorth = accounts.reduce((total, account) => {
    const amount = new Prisma.Decimal(account.currentBalance);
    const converted = convertToBaseCurrency(
      amount,
      account.currency,
      currencySettings
    );
    return total.plus(converted);
  }, new Prisma.Decimal(0));

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Accounts</h1>
          <p className="text-sm text-muted-foreground">
            See every account and the balance in one place.
          </p>
        </div>
        <AddAccountModal trigger={<Button size="sm">Add Account</Button>} />
      </header>

      <NetWorthCard
        total={totalNetWorth.toString()}
        currency={currencySettings.baseCurrency}
      />

      {accounts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
            <p className="text-sm text-muted-foreground">
              No accounts yet. Add your first account to start tracking.
            </p>
            <AddAccountModal
              trigger={<Button variant="outline">Create Account</Button>}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <AccountCard key={account.id} account={account} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function AccountsPage() {
  return (
    <Suspense fallback={<AccountsSkeleton />}>
      <AccountsContent />
    </Suspense>
  );
}

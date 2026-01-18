"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  CreditCard,
  Landmark,
  Loader2,
  MoreHorizontal,
  PiggyBank,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import type { AccountType } from "@prisma/client";
import { deleteAccount } from "@/lib/actions/account.actions";
import { formatCurrency } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const typeLabels: Record<AccountType, string> = {
  CHECKING: "Checking",
  SAVINGS: "Savings",
  CREDIT: "Credit",
  CASH: "Cash",
  INVESTMENT: "Investment",
};

const typeIcons: Record<AccountType, typeof Wallet> = {
  CHECKING: Landmark,
  SAVINGS: PiggyBank,
  CREDIT: CreditCard,
  CASH: Wallet,
  INVESTMENT: Landmark,
};

type AccountCardProps = {
  account: {
    id: string;
    name: string;
    type: AccountType;
    currency: string;
    color: string;
    icon: string;
    currentBalance: string;
  };
};

export function AccountCard({ account }: AccountCardProps) {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const Icon = typeIcons[account.type] ?? Wallet;
  const balanceValue = Number(account.currentBalance);
  const balanceColor =
    account.type === "CREDIT" && balanceValue > 0
      ? "text-destructive"
      : "text-foreground";

  const confirmDelete = async () => {
    setIsDeleting(true);
    const response = await deleteAccount({ id: account.id });
    setIsDeleting(false);

    if (!response.success) {
      toast.error(response.error ?? "Failed to delete account.");
      return;
    }

    toast.success("Account deleted.");
    setDeleteOpen(false);
    router.refresh();
  };

  const handleDeleteOpenChange = (open: boolean) => {
    if (isDeleting) return;
    setDeleteOpen(open);
  };

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span
            className="rounded-full bg-muted/60 p-2"
            style={{ color: account.color }}
          >
            <Icon className="h-4 w-4" />
          </span>
          <div className="space-y-1">
            <CardTitle className="text-base">{account.name}</CardTitle>
            <Badge variant="outline">{typeLabels[account.type]}</Badge>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" disabled={isDeleting}>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/transactions?accountId=${account.id}`}>
                View Transactions
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onSelect={() => setDeleteOpen(true)}
              disabled={isDeleting}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <div className={`text-2xl font-semibold ${balanceColor}`}>
          {formatCurrency(account.currentBalance, account.currency)}
        </div>
        <p className="text-sm text-muted-foreground">{account.currency}</p>
      </CardContent>
      <CardFooter className="mt-auto">
        <Button asChild variant="ghost" size="sm" className="px-0">
          <Link href={`/transactions?accountId=${account.id}`}>
            View Transactions
          </Link>
        </Button>
      </CardFooter>
      <AlertDialog open={deleteOpen} onOpenChange={handleDeleteOpenChange}>
        <AlertDialogContent className="border-destructive">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete account?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the account and its transactions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="gap-2 bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

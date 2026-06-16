import { Suspense } from "react";

import WalletGate from "@/components/dashboard/WalletGate";
import AppShell from "@/components/layout/AppShell";
import TransactionsSkeleton from "@/components/transactions/TransactionsSkeleton";
import TransactionsView from "@/components/transactions/TransactionsView";

export default function TransactionsPage() {
  return (
    <AppShell
      activePath="/transactions"
      contentClassName="flex-1 overflow-y-auto p-5"
    >
      <WalletGate>
        <Suspense fallback={<TransactionsSkeleton />}>
          <TransactionsView />
        </Suspense>
      </WalletGate>
    </AppShell>
  );
}

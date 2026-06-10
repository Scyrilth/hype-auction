import { Suspense } from "react";

import WalletGate from "@/components/dashboard/WalletGate";
import Sidebar from "@/components/layout/Sidebar";
import TopNav from "@/components/layout/TopNav";
import TransactionsSkeleton from "@/components/transactions/TransactionsSkeleton";
import TransactionsView from "@/components/transactions/TransactionsView";

export default function TransactionsPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar activePath="/transactions" />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopNav />

        <main className="flex-1 overflow-y-auto p-5">
          <WalletGate>
            <Suspense fallback={<TransactionsSkeleton />}>
              <TransactionsView />
            </Suspense>
          </WalletGate>
        </main>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";

import CreateAuctionForm from "@/components/dashboard/CreateAuctionForm";
import SellerAuctionsList from "@/components/dashboard/SellerAuctionsList";
export default function DashboardView() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCreated = () => {
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Seller Dashboard</h1>
          <p className="mt-1 text-sm text-muted">
            Create listings and manage your live auctions.
          </p>
          <Link
            href="/dashboard/settings"
            className="mt-2 inline-block text-sm text-accent hover:underline"
          >
            Customize your shop →
          </Link>
        </div>

      <CreateAuctionForm onCreated={handleCreated} />
      <SellerAuctionsList refreshKey={refreshKey} />
    </div>
  );
}

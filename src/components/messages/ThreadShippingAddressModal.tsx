"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useToast } from "@/components/ui/Toast";
import { useSupabaseClient } from "@/hooks/useSupabaseClient";
import { COUNTRIES } from "@/lib/countries";
import type { ShippingAddress, ShippingAddressInput } from "@/lib/database.types";
import { getErrorMessage } from "@/lib/errors";
import { createShippingAddress, getShippingAddresses } from "@/lib/shipping";
import { formatThreadShippingRateLabel } from "@/lib/thread-shipping";

const inputClass =
  "mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-white outline-none focus:border-accent focus:ring-1 focus:ring-accent";

const emptyForm: ShippingAddressInput = {
  nickname: "Home",
  full_name: "",
  address_line1: "",
  address_line2: "",
  city: "",
  state: "",
  postal_code: "",
  country: "United States",
  phone: "",
  is_default: false,
};

function formatAddressSummary(address: ShippingAddress) {
  const line = [address.address_line1, address.address_line2]
    .filter(Boolean)
    .join(", ");
  const cityLine = [address.city, address.country].filter(Boolean).join(", ");
  return {
    name: address.full_name,
    line,
    cityLine,
  };
}

function InlineAddressForm({
  walletAddress,
  onCreated,
  onCancel,
}: {
  walletAddress: string;
  onCreated: (address: ShippingAddress) => void;
  onCancel: () => void;
}) {
  const { client } = useSupabaseClient();
  const { showToast } = useToast();
  const [form, setForm] = useState<ShippingAddressInput>(emptyForm);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const created = await createShippingAddress(walletAddress, form, client);
      showToast("Address saved.");
      onCreated(created);
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 rounded-xl border border-border bg-background/60 p-4"
    >
      <p className="text-sm font-semibold text-white">Add new address</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="block text-xs font-medium text-muted">
          Full name
          <input
            type="text"
            required
            value={form.full_name}
            onChange={(event) =>
              setForm((current) => ({ ...current, full_name: event.target.value }))
            }
            className={inputClass}
          />
        </label>
        <label className="block text-xs font-medium text-muted sm:col-span-2">
          Address line 1
          <input
            type="text"
            required
            value={form.address_line1}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                address_line1: event.target.value,
              }))
            }
            className={inputClass}
          />
        </label>
        <label className="block text-xs font-medium text-muted sm:col-span-2">
          Address line 2 (optional)
          <input
            type="text"
            value={form.address_line2 ?? ""}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                address_line2: event.target.value,
              }))
            }
            className={inputClass}
          />
        </label>
        <label className="block text-xs font-medium text-muted">
          City
          <input
            type="text"
            required
            value={form.city}
            onChange={(event) =>
              setForm((current) => ({ ...current, city: event.target.value }))
            }
            className={inputClass}
          />
        </label>
        <label className="block text-xs font-medium text-muted">
          Country
          <select
            required
            value={form.country}
            onChange={(event) =>
              setForm((current) => ({ ...current, country: event.target.value }))
            }
            className={inputClass}
          >
            {COUNTRIES.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs font-medium text-muted">
          Postal / ZIP code
          <input
            type="text"
            required
            value={form.postal_code}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                postal_code: event.target.value,
              }))
            }
            className={inputClass}
          />
        </label>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save address"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-border px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-accent/50 hover:text-white"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function ThreadShippingAddressModal({
  open,
  threadId,
  auctionId,
  buyerWallet,
  sellerCountry,
  shipsInternationally,
  domesticShippingUsd,
  internationalShippingUsd,
  isExempt,
  initialAddressId,
  onConfirmed,
  onDismiss,
}: {
  open: boolean;
  threadId: string;
  auctionId: string;
  buyerWallet: string;
  sellerCountry: string | null;
  shipsInternationally: boolean;
  domesticShippingUsd: number;
  internationalShippingUsd: number;
  isExempt: boolean;
  initialAddressId?: string | null;
  onConfirmed: (result: {
    shippingUsd: number;
    shippingCountry: string;
    addressId: string;
  }) => void;
  onDismiss: () => void;
}) {
  const { client } = useSupabaseClient();
  const { showToast } = useToast();
  const [addresses, setAddresses] = useState<ShippingAddress[]>([]);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const loadAddresses = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await getShippingAddresses(buyerWallet, client);
      setAddresses(rows);
      const preferred =
        (initialAddressId
          ? rows.find((row) => row.id === initialAddressId)
          : undefined) ??
        rows.find((row) => row.is_default) ??
        rows[0] ??
        null;
      setSelectedId(preferred?.id ?? null);
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    } finally {
      setLoading(false);
    }
  }, [buyerWallet, client, initialAddressId, showToast]);

  useEffect(() => {
    if (!open) return;
    setShowAddForm(false);
    void loadAddresses();
  }, [open, loadAddresses]);

  const rateByAddressId = useMemo(() => {
    const map = new Map<string, string>();
    for (const address of addresses) {
      map.set(
        address.id,
        formatThreadShippingRateLabel({
          buyerCountry: address.country,
          sellerCountry,
          domesticShippingUsd,
          internationalShippingUsd,
          shipsInternationally,
          isExempt,
        })
      );
    }
    return map;
  }, [
    addresses,
    domesticShippingUsd,
    internationalShippingUsd,
    isExempt,
    sellerCountry,
    shipsInternationally,
  ]);

  const handleConfirm = async () => {
    if (!selectedId) {
      showToast("Select a shipping address.", "error");
      return;
    }

    const rateLabel = rateByAddressId.get(selectedId);
    if (rateLabel === "Shipping unavailable to this country") {
      showToast(rateLabel, "error");
      return;
    }

    setConfirming(true);
    try {
      const response = await fetch("/api/messages/shipping-address", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-wallet-address": buyerWallet,
        },
        body: JSON.stringify({
          action: "confirm",
          threadId,
          auctionId,
          buyerWallet,
          addressId: selectedId,
        }),
      });
      const payload = (await response.json()) as {
        error?: string;
        shippingUsd?: number;
        shippingCountry?: string;
        address?: ShippingAddress;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to confirm shipping address.");
      }

      onConfirmed({
        shippingUsd: payload.shippingUsd ?? 0,
        shippingCountry: payload.shippingCountry ?? "",
        addressId: selectedId,
      });
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    } finally {
      setConfirming(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/75"
        onClick={onDismiss}
        aria-label="Close"
      />
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-xl">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-lg font-bold text-white">Confirm shipping address</h2>
          <p className="mt-1 text-sm text-muted">
            Choose where this item should be shipped. The rate depends on your
            address country.
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <p className="text-sm text-muted">Loading addresses...</p>
          ) : addresses.length === 0 && !showAddForm ? (
            <p className="text-sm text-muted">
              No saved addresses yet. Add one below to continue.
            </p>
          ) : (
            <div className="space-y-2">
              {addresses.map((address) => {
                const summary = formatAddressSummary(address);
                const rateLabel = rateByAddressId.get(address.id) ?? "";
                const unavailable = rateLabel === "Shipping unavailable to this country";

                return (
                  <label
                    key={address.id}
                    className={`flex cursor-pointer gap-3 rounded-xl border p-3 transition-colors ${
                      selectedId === address.id
                        ? "border-accent bg-accent/10"
                        : "border-border bg-background/40 hover:border-accent/40"
                    } ${unavailable ? "opacity-60" : ""}`}
                  >
                    <input
                      type="radio"
                      name="thread-shipping-address"
                      value={address.id}
                      checked={selectedId === address.id}
                      onChange={() => setSelectedId(address.id)}
                      disabled={unavailable}
                      className="mt-1 shrink-0 accent-accent"
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-white">
                        {summary.name}
                      </span>
                      <span className="mt-0.5 block text-xs text-zinc-300">
                        {summary.line}
                      </span>
                      <span className="block text-xs text-zinc-400">
                        {summary.cityLine}
                      </span>
                      <span className="mt-1 block text-[11px] text-muted">
                        {rateLabel}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          )}

          {showAddForm ? (
            <InlineAddressForm
              walletAddress={buyerWallet}
              onCreated={(address) => {
                setShowAddForm(false);
                setAddresses((current) => [address, ...current]);
                setSelectedId(address.id);
              }}
              onCancel={() => setShowAddForm(false)}
            />
          ) : (
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border px-4 py-3 text-sm font-medium text-zinc-300 transition-colors hover:border-accent/50 hover:text-white"
            >
              <span className="text-lg leading-none">+</span>
              Add new address
            </button>
          )}
        </div>

        <div className="flex flex-col gap-2 border-t border-border px-5 py-4 sm:flex-row">
          <button
            type="button"
            onClick={onDismiss}
            className="flex-1 rounded-full border border-border py-2.5 text-sm font-semibold text-zinc-300 transition-colors hover:border-accent/50 hover:text-white"
          >
            Not now
          </button>
          <button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={confirming || !selectedId || showAddForm}
            className="flex-1 rounded-full bg-accent py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {confirming ? "Saving..." : "Confirm address"}
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";

import { useToast } from "@/components/ui/Toast";
import { useSupabaseClient } from "@/hooks/useSupabaseClient";
import { COUNTRIES } from "@/lib/countries";
import type { ShippingAddress, ShippingAddressInput } from "@/lib/database.types";
import { getErrorMessage, logSupabaseError } from "@/lib/errors";
import {
  createShippingAddress,
  deleteShippingAddress,
  getShippingAddresses,
  isShippingAddressLocked,
  updateShippingAddress,
} from "@/lib/shipping";

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

function formatAddressLine(address: ShippingAddress) {
  const parts = [
    address.address_line1,
    address.address_line2,
    [address.city, address.state].filter(Boolean).join(", "),
    address.postal_code,
    address.country,
  ].filter(Boolean);

  return parts.join(" · ");
}

function AddressForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
  saving,
}: {
  initial: ShippingAddressInput;
  submitLabel: string;
  onSubmit: (values: ShippingAddressInput) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<ShippingAddressInput>(initial);

  useEffect(() => {
    setForm(initial);
  }, [initial]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await onSubmit(form);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-border bg-surface-elevated p-5"
    >
      <h3 className="text-sm font-semibold text-white">
        {submitLabel === "Save address" ? "Edit address" : "Add new address"}
      </h3>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block text-xs font-medium text-muted">
          Nickname
          <input
            type="text"
            required
            value={form.nickname}
            onChange={(event) =>
              setForm((current) => ({ ...current, nickname: event.target.value }))
            }
            placeholder="Home, Work..."
            className={inputClass}
          />
        </label>

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
          State / Province
          <input
            type="text"
            value={form.state ?? ""}
            onChange={(event) =>
              setForm((current) => ({ ...current, state: event.target.value }))
            }
            className={inputClass}
          />
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

        <label className="block text-xs font-medium text-muted sm:col-span-2">
          Phone number
          <input
            type="tel"
            value={form.phone ?? ""}
            onChange={(event) =>
              setForm((current) => ({ ...current, phone: event.target.value }))
            }
            className={inputClass}
          />
        </label>
      </div>

      <label className="mt-4 flex items-center gap-2 text-sm text-zinc-300">
        <input
          type="checkbox"
          checked={form.is_default ?? false}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              is_default: event.target.checked,
            }))
          }
          className="rounded border-border bg-background text-accent focus:ring-accent"
        />
        Set as default
      </label>

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-60"
        >
          {saving ? "Saving..." : submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-border px-5 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-accent/50 hover:text-white"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function ProfileShippingTab({
  walletAddress,
}: {
  walletAddress: string;
}) {
  const { showToast } = useToast();
  const { client } = useSupabaseClient();
  const [addresses, setAddresses] = useState<ShippingAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const loadAddresses = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getShippingAddresses(walletAddress, client);
      setAddresses(data);
    } catch (error) {
      logSupabaseError("ProfileShippingTab: load", error);
      showToast(getErrorMessage(error), "error");
    } finally {
      setLoading(false);
    }
  }, [client, walletAddress, showToast]);

  useEffect(() => {
    void loadAddresses();
  }, [loadAddresses]);

  const handleCreate = async (values: ShippingAddressInput) => {
    setSaving(true);
    try {
      await createShippingAddress(walletAddress, values, client);
      showToast("Address saved.");
      setShowAddForm(false);
      await loadAddresses();
    } catch (error) {
      logSupabaseError("ProfileShippingTab: create", error);
      showToast(getErrorMessage(error), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (addressId: string, values: ShippingAddressInput) => {
    setSaving(true);
    try {
      await updateShippingAddress(walletAddress, addressId, values, client);
      showToast("Address updated.");
      setEditingId(null);
      await loadAddresses();
    } catch (error) {
      logSupabaseError("ProfileShippingTab: update", error);
      showToast(getErrorMessage(error), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (address: ShippingAddress) => {
    if (isShippingAddressLocked(address)) return;
    if (!window.confirm(`Delete "${address.nickname}"?`)) return;

    setSaving(true);
    try {
      await deleteShippingAddress(walletAddress, address.id, client);
      showToast("Address deleted.");
      if (editingId === address.id) setEditingId(null);
      await loadAddresses();
    } catch (error) {
      logSupabaseError("ProfileShippingTab: delete", error);
      showToast(getErrorMessage(error), "error");
    } finally {
      setSaving(false);
    }
  };

  const editingAddress = addresses.find((address) => address.id === editingId);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          Manage shipping addresses for items you win at auction.
        </p>
        {!showAddForm && !editingId && (
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
          >
            Add new address
          </button>
        )}
      </div>

      {showAddForm && (
        <AddressForm
          initial={emptyForm}
          submitLabel="Add address"
          onSubmit={handleCreate}
          onCancel={() => setShowAddForm(false)}
          saving={saving}
        />
      )}

      {loading ? (
        <p className="text-sm text-muted">Loading addresses...</p>
      ) : addresses.length === 0 && !showAddForm ? (
        <div className="rounded-2xl border border-border bg-surface px-6 py-12 text-center">
          <p className="text-sm text-muted">No saved addresses yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {addresses.map((address) => {
            const locked = isShippingAddressLocked(address);

            if (editingId === address.id && editingAddress) {
              return (
                <AddressForm
                  key={address.id}
                  initial={{
                    nickname: editingAddress.nickname,
                    full_name: editingAddress.full_name,
                    address_line1: editingAddress.address_line1,
                    address_line2: editingAddress.address_line2 ?? "",
                    city: editingAddress.city,
                    state: editingAddress.state ?? "",
                    postal_code: editingAddress.postal_code,
                    country: editingAddress.country,
                    phone: editingAddress.phone ?? "",
                    is_default: editingAddress.is_default,
                  }}
                  submitLabel="Save address"
                  onSubmit={(values) => handleUpdate(address.id, values)}
                  onCancel={() => setEditingId(null)}
                  saving={saving}
                />
              );
            }

            return (
              <article
                key={address.id}
                className="rounded-2xl border border-border bg-surface p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold text-white">
                        {address.nickname}
                      </h3>
                      {address.is_default && (
                        <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-300">
                          Default
                        </span>
                      )}
                      {locked && (
                        <span className="rounded-md bg-surface-elevated px-2 py-0.5 text-[10px] font-medium text-muted">
                          Used for won auction
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-zinc-300">{address.full_name}</p>
                    <p className="mt-1 text-sm text-muted">
                      {formatAddressLine(address)}
                    </p>
                    {address.phone && (
                      <p className="mt-1 text-sm text-muted">{address.phone}</p>
                    )}
                  </div>

                  {!locked && (
                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddForm(false);
                          setEditingId(address.id);
                        }}
                        className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:border-accent/50 hover:text-white"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(address)}
                        disabled={saving}
                        className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-red-300 transition-colors hover:border-red-400/50 hover:text-red-200 disabled:opacity-60"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

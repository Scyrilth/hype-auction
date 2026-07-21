"use client";

import { useCallback, useEffect, useState } from "react";

import { useToast } from "@/components/ui/Toast";
import { useSupabaseClient } from "@/hooks/useSupabaseClient";
import type { ShippingProfile, ShippingProfileInput } from "@/lib/database.types";
import { getErrorMessage, logSupabaseError } from "@/lib/errors";
import { AUCTION_CATEGORIES } from "@/lib/seller";
import {
  createShippingProfile,
  deleteShippingProfile,
  getShippingProfiles,
  updateShippingProfile,
} from "@/lib/shipping-profiles";

const inputClass =
  "mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-white outline-none focus:border-accent focus:ring-1 focus:ring-accent";

const labelClass =
  "block text-xs font-medium uppercase tracking-wider text-muted";

const emptyForm: ShippingProfileInput = {
  name: "",
  category: AUCTION_CATEGORIES[0],
  domestic_shipping_usd: 0,
  international_shipping_usd: 0,
  ships_internationally: false,
};

function formatProfileSummary(profile: ShippingProfile) {
  const domestic =
    profile.domestic_shipping_usd <= 0
      ? "Free domestic"
      : `$${profile.domestic_shipping_usd.toFixed(2)} domestic`;
  const international = profile.ships_internationally
    ? profile.international_shipping_usd <= 0
      ? "Free international"
      : `$${profile.international_shipping_usd.toFixed(2)} international`
    : "Domestic only";

  return `${profile.category} · ${domestic} · ${international}`;
}

function ProfileForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
  saving,
}: {
  initial: ShippingProfileInput;
  submitLabel: string;
  onSubmit: (values: ShippingProfileInput) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<ShippingProfileInput>(initial);

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
        {submitLabel === "Save profile" ? "Edit shipping profile" : "New shipping profile"}
      </h3>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className={labelClass}>Profile name</span>
          <input
            type="text"
            required
            value={form.name}
            onChange={(event) =>
              setForm((current) => ({ ...current, name: event.target.value }))
            }
            placeholder='e.g. "Trading Card - Sleeved"'
            className={inputClass}
          />
        </label>

        <label className="block">
          <span className={labelClass}>Category</span>
          <select
            required
            value={form.category}
            onChange={(event) =>
              setForm((current) => ({ ...current, category: event.target.value }))
            }
            className={inputClass}
          >
            {AUCTION_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-end">
          <span className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-border bg-background px-4 py-3">
            <input
              type="checkbox"
              checked={form.ships_internationally}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  ships_internationally: event.target.checked,
                  international_shipping_usd: event.target.checked
                    ? current.international_shipping_usd
                    : 0,
                }))
              }
              className="h-4 w-4 rounded border-border accent-accent"
            />
            <span className="text-sm text-zinc-300">Ships internationally</span>
          </span>
        </label>

        <label className="block">
          <span className={labelClass}>Domestic shipping (USD)</span>
          <input
            type="number"
            min="0"
            step="0.01"
            required
            value={form.domestic_shipping_usd}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                domestic_shipping_usd: parseFloat(event.target.value) || 0,
              }))
            }
            className={inputClass}
          />
        </label>

        {form.ships_internationally && (
          <label className="block">
            <span className={labelClass}>International shipping (USD)</span>
            <input
              type="number"
              min="0"
              step="0.01"
              required
              value={form.international_shipping_usd}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  international_shipping_usd: parseFloat(event.target.value) || 0,
                }))
              }
              className={inputClass}
            />
          </label>
        )}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-60"
        >
          {saving ? "Saving..." : submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="rounded-full border border-border px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-accent/50 hover:text-white disabled:opacity-60"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function ShippingProfilesSection({
  sellerWallet,
}: {
  sellerWallet: string;
}) {
  const { showToast } = useToast();
  const { client } = useSupabaseClient();
  const [profiles, setProfiles] = useState<ShippingProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const loadProfiles = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getShippingProfiles(sellerWallet, client);
      setProfiles(data);
    } catch (error) {
      logSupabaseError("ShippingProfilesSection: load", error);
      showToast(getErrorMessage(error), "error");
    } finally {
      setLoading(false);
    }
  }, [client, sellerWallet, showToast]);

  useEffect(() => {
    void loadProfiles();
  }, [loadProfiles]);

  const handleCreate = async (values: ShippingProfileInput) => {
    if (!values.name.trim()) {
      showToast("Enter a profile name.", "error");
      return;
    }

    setSaving(true);
    try {
      await createShippingProfile(sellerWallet, values, client);
      showToast("Shipping profile saved.");
      setShowAddForm(false);
      await loadProfiles();
    } catch (error) {
      logSupabaseError("ShippingProfilesSection: create", error);
      showToast(getErrorMessage(error), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (profileId: string, values: ShippingProfileInput) => {
    if (!values.name.trim()) {
      showToast("Enter a profile name.", "error");
      return;
    }

    setSaving(true);
    try {
      await updateShippingProfile(sellerWallet, profileId, values, client);
      showToast("Shipping profile updated.");
      setEditingId(null);
      await loadProfiles();
    } catch (error) {
      logSupabaseError("ShippingProfilesSection: update", error);
      showToast(getErrorMessage(error), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (profile: ShippingProfile) => {
    if (!window.confirm(`Delete "${profile.name}"?`)) return;

    setSaving(true);
    try {
      await deleteShippingProfile(sellerWallet, profile.id, client);
      showToast("Shipping profile deleted.");
      if (editingId === profile.id) setEditingId(null);
      await loadProfiles();
    } catch (error) {
      logSupabaseError("ShippingProfilesSection: delete", error);
      showToast(getErrorMessage(error), "error");
    } finally {
      setSaving(false);
    }
  };

  const editingProfile = profiles.find((profile) => profile.id === editingId);

  return (
    <section className="space-y-4 rounded-2xl border border-border bg-surface p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-5">
        <div>
          <h2 className="text-lg font-semibold text-white">Shipping profiles</h2>
          <p className="mt-1 text-sm text-muted">
            Save reusable shipping presets for faster listing creation.
          </p>
        </div>
        {!showAddForm && !editingId && (
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
          >
            Add profile
          </button>
        )}
      </div>

      {showAddForm && (
        <ProfileForm
          initial={emptyForm}
          submitLabel="Add profile"
          onSubmit={handleCreate}
          onCancel={() => setShowAddForm(false)}
          saving={saving}
        />
      )}

      {loading ? (
        <p className="text-sm text-muted">Loading shipping profiles...</p>
      ) : profiles.length === 0 && !showAddForm ? (
        <div className="rounded-2xl border border-border bg-surface-elevated px-6 py-10 text-center">
          <p className="text-sm text-muted">No shipping profiles yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {profiles.map((profile) => {
            if (editingId === profile.id && editingProfile) {
              return (
                <ProfileForm
                  key={profile.id}
                  initial={{
                    name: editingProfile.name,
                    category: editingProfile.category,
                    domestic_shipping_usd: editingProfile.domestic_shipping_usd,
                    international_shipping_usd:
                      editingProfile.international_shipping_usd,
                    ships_internationally: editingProfile.ships_internationally,
                  }}
                  submitLabel="Save profile"
                  onSubmit={(values) => handleUpdate(profile.id, values)}
                  onCancel={() => setEditingId(null)}
                  saving={saving}
                />
              );
            }

            return (
              <article
                key={profile.id}
                className="rounded-2xl border border-border bg-surface-elevated p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-white">
                      {profile.name}
                    </h3>
                    <p className="mt-1 text-sm text-muted">
                      {formatProfileSummary(profile)}
                    </p>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddForm(false);
                        setEditingId(profile.id);
                      }}
                      className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:border-accent/50 hover:text-white"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(profile)}
                      disabled={saving}
                      className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-red-300 transition-colors hover:border-red-400/50 hover:text-red-200 disabled:opacity-60"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

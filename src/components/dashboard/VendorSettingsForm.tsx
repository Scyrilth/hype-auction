"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";

import ImageUpload from "@/components/ui/ImageUpload";
import SellerProfileSetupBanner from "@/components/dashboard/SellerProfileSetupBanner";
import { useToast } from "@/components/ui/Toast";
import { getErrorMessage, logSupabaseError } from "@/lib/errors";
import { displaySocialHandle, shortenAddress } from "@/lib/format";
import { getImageExtension } from "@/lib/storage";
import { COUNTRY_OPTIONS } from "@/lib/countries";
import {
  getVendorSettings,
  updateVendorSettings,
} from "@/lib/vendors";
import type { User } from "@/lib/database.types";
import { upsertUser } from "@/lib/users";

const inputClass =
  "w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted outline-none focus:border-accent focus:ring-1 focus:ring-accent";

const labelClass =
  "mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted";

export default function VendorSettingsForm() {
  const { publicKey } = useWallet();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<User | null>(null);

  const [username, setUsername] = useState("");
  const [shopName, setShopName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [bio, setBio] = useState("");
  const [shopDescription, setShopDescription] = useState("");
  const [twitterHandle, setTwitterHandle] = useState("");
  const [instagramHandle, setInstagramHandle] = useState("");
  const [isVendor, setIsVendor] = useState(false);
  const [showCopyWallet, setShowCopyWallet] = useState(true);
  const [country, setCountry] = useState("");
  const [shipsInternationally, setShipsInternationally] = useState(false);

  useEffect(() => {
    if (!publicKey) return;

    let cancelled = false;

    async function load() {
      setIsLoading(true);
      try {
        await upsertUser(publicKey!.toBase58());
        const data = await getVendorSettings(publicKey!.toBase58());
        if (cancelled || !data) return;

        setProfile(data);
        setUsername(data.username ?? "");
        setShopName(data.shop_name ?? "");
        setAvatarUrl(data.avatar_url ?? "");
        setBannerUrl(data.banner_image ?? "");
        setBio(data.bio ?? "");
        setShopDescription(data.shop_description ?? "");
        setTwitterHandle(displaySocialHandle(data.social_twitter));
        setInstagramHandle(displaySocialHandle(data.social_instagram));
        setIsVendor(data.is_vendor);
        setShowCopyWallet(data.show_copy_wallet ?? true);
        setCountry(data.country ?? "");
        setShipsInternationally(data.ships_internationally ?? false);
      } catch (error) {
        logSupabaseError("VendorSettingsForm.load", error);
        showToast(getErrorMessage(error), "error");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [publicKey, showToast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicKey) return;

    if (!country.trim()) {
      showToast("Select your shop country before saving.", "error");
      return;
    }

    setIsSaving(true);

    try {
      const walletAddress = publicKey.toBase58();

      await upsertUser(walletAddress);

      const updated = await updateVendorSettings(walletAddress, {
        username,
        shopName,
        avatarUrl,
        bannerUrl,
        bio,
        shopDescription,
        twitterHandle,
        instagramHandle,
        isVendor,
        showCopyWallet,
        country,
        shipsInternationally,
      });

      setProfile(updated);
      showToast("Shop settings saved!");
    } catch (error) {
      logSupabaseError("VendorSettingsForm.save", error);
      showToast(getErrorMessage(error), "error");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-8 text-center">
        <p className="text-sm text-muted">Loading settings...</p>
      </div>
    );
  }

  const shopSlug =
    profile?.username?.trim() || publicKey?.toBase58() || "";
  const showSellerSetupBanner = !country.trim();

  return (
    <>
      <SellerProfileSetupBanner visible={showSellerSetupBanner} />
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-2xl border border-border bg-surface p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-5">
        <div>
          <h2 className="text-lg font-semibold text-white">Vendor profile</h2>
          <p className="mt-1 text-sm text-muted">
            Wallet: {publicKey ? shortenAddress(publicKey.toBase58(), 6) : "—"}
          </p>
        </div>
        {shopSlug && (
          <Link
            href={`/shop/${shopSlug}`}
            className="rounded-full border border-border px-4 py-2 text-sm text-zinc-300 transition-colors hover:border-accent/50 hover:text-white"
          >
            View shop
          </Link>
        )}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="shopName" className={labelClass}>
            Shop name
          </label>
          <input
            id="shopName"
            type="text"
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
            placeholder="My Collectibles Shop"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="username" className={labelClass}>
            Username
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="yourname"
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="country" className={labelClass}>
            Country <span className="text-live-red">*</span>
          </label>
          <select
            id="country"
            required
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className={inputClass}
          >
            <option value="">Select country</option>
            {COUNTRY_OPTIONS.map((option) => (
              <option key={option.code} value={option.code}>
                {option.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <label className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-border bg-background px-4 py-3">
            <input
              type="checkbox"
              checked={shipsInternationally}
              onChange={(e) => setShipsInternationally(e.target.checked)}
              className="h-4 w-4 rounded border-border accent-accent"
            />
            <div>
              <p className="text-sm font-medium text-white">
                Ships internationally <span className="text-live-red">*</span>
              </p>
              <p className="text-xs text-muted">
                Offer international flat-rate shipping on listings
              </p>
            </div>
          </label>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <ImageUpload
          label="Avatar"
          bucket="Avatars"
          variant="avatar"
          maxSizeMb={5}
          walletAddress={publicKey?.toBase58()}
          value={avatarUrl}
          onChange={setAvatarUrl}
          buildPath={(file) =>
            `${publicKey!.toBase58()}/avatar.${getImageExtension(file)}`
          }
          onUploaded={async (url) => {
            if (!publicKey) return;
            const updated = await updateVendorSettings(publicKey.toBase58(), {
              username,
              shopName,
              avatarUrl: url,
              bannerUrl,
              bio,
              shopDescription,
              twitterHandle,
              instagramHandle,
              isVendor,
              showCopyWallet,
              country,
              shipsInternationally,
            });
            setProfile(updated);
            showToast("Avatar uploaded!");
          }}
          disabled={!publicKey}
        />

        <ImageUpload
          label="Banner"
          bucket="Banners"
          variant="banner"
          maxSizeMb={5}
          value={bannerUrl}
          onChange={setBannerUrl}
          buildPath={(file) =>
            `${publicKey!.toBase58()}/banner.${getImageExtension(file)}`
          }
          onUploaded={async (url) => {
            if (!publicKey) return;
            const updated = await updateVendorSettings(publicKey.toBase58(), {
              username,
              shopName,
              avatarUrl,
              bannerUrl: url,
              bio,
              shopDescription,
              twitterHandle,
              instagramHandle,
              isVendor,
              showCopyWallet,
              country,
              shipsInternationally,
            });
            setProfile(updated);
            showToast("Banner uploaded!");
          }}
          disabled={!publicKey}
        />
      </div>

      <div>
        <label htmlFor="bio" className={labelClass}>
          Bio
        </label>
        <textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
          placeholder="Short bio for your shop header"
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="shopDescription" className={labelClass}>
          Shop description
        </label>
        <textarea
          id="shopDescription"
          value={shopDescription}
          onChange={(e) => setShopDescription(e.target.value)}
          rows={4}
          placeholder="Tell buyers what you sell and your auction style"
          className={inputClass}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="twitterHandle" className={labelClass}>
            X (Twitter)
          </label>
          <input
            id="twitterHandle"
            type="text"
            value={twitterHandle}
            onChange={(e) => setTwitterHandle(e.target.value)}
            placeholder="@yourhandle"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="instagramHandle" className={labelClass}>
            Instagram
          </label>
          <input
            id="instagramHandle"
            type="text"
            value={instagramHandle}
            onChange={(e) => setInstagramHandle(e.target.value)}
            placeholder="@yourhandle"
            className={inputClass}
          />
        </div>
      </div>

      <p className="text-xs text-muted">OAuth verification coming soon</p>

      <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-background px-4 py-3">
        <input
          type="checkbox"
          checked={showCopyWallet}
          onChange={(e) => setShowCopyWallet(e.target.checked)}
          className="h-4 w-4 rounded border-border accent-accent"
        />
        <div>
          <p className="text-sm font-medium text-white">Show copy wallet button</p>
          <p className="text-xs text-muted">
            Display a copy button next to your wallet on the dashboard
          </p>
        </div>
      </label>

      <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-background px-4 py-3">
        <input
          type="checkbox"
          checked={isVendor}
          onChange={(e) => setIsVendor(e.target.checked)}
          className="h-4 w-4 rounded border-border accent-accent"
        />
        <div>
          <p className="text-sm font-medium text-white">Enable vendor shop</p>
          <p className="text-xs text-muted">
            Show your public shop page and accept followers
          </p>
        </div>
      </label>

      <button
        type="submit"
        disabled={isSaving}
        className="w-full rounded-full bg-accent py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-8"
      >
        {isSaving ? "Saving..." : "Save settings"}
      </button>
    </form>
    </>
  );
}

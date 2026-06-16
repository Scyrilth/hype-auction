import { notFound } from "next/navigation";

import AppShell from "@/components/layout/AppShell";
import ProfileView from "@/components/profile/ProfileView";
import BackButton from "@/components/ui/BackButton";
import { getBuyerProfileData } from "@/lib/profile";

export const dynamic = "force-dynamic";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const profile = await getBuyerProfileData(username);

  if (!profile) {
    notFound();
  }

  return (
    <AppShell contentClassName="flex-1 overflow-y-auto p-4 sm:p-5">
      <BackButton className="mb-4" />
      <ProfileView profile={profile} />
    </AppShell>
  );
}

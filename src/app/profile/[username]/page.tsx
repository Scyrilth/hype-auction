import { notFound } from "next/navigation";

import Sidebar from "@/components/layout/Sidebar";
import TopNav from "@/components/layout/TopNav";
import ProfileView from "@/components/profile/ProfileView";
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
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopNav />

        <main className="flex-1 overflow-y-auto p-4 sm:p-5">
          <ProfileView profile={profile} />
        </main>
      </div>
    </div>
  );
}

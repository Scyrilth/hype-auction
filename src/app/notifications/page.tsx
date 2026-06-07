import NotificationsView from "@/components/notifications/NotificationsView";
import Sidebar from "@/components/layout/Sidebar";
import TopNav from "@/components/layout/TopNav";
import BackButton from "@/components/ui/BackButton";

export const dynamic = "force-dynamic";

export default function NotificationsPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopNav />

        <main className="flex-1 overflow-y-auto p-4 sm:p-5">
          <BackButton className="mb-4" />
          <NotificationsView />
        </main>
      </div>
    </div>
  );
}

import MessagesView from "@/components/messages/MessagesView";
import Sidebar from "@/components/layout/Sidebar";
import TopNav from "@/components/layout/TopNav";

export const dynamic = "force-dynamic";

export default function MessagesPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopNav />

        <main className="flex-1 overflow-y-auto p-4 sm:p-5">
          <MessagesView />
        </main>
      </div>
    </div>
  );
}

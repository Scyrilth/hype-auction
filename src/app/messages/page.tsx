import MessagesView from "@/components/messages/MessagesView";
import AppShell from "@/components/layout/AppShell";

export const dynamic = "force-dynamic";

export default function MessagesPage() {
  return (
    <AppShell contentClassName="flex-1 overflow-y-auto p-4 sm:p-5">
      <MessagesView />
    </AppShell>
  );
}

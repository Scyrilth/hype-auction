import ThreadView from "@/components/messages/ThreadView";
import AppShell from "@/components/layout/AppShell";
import BackButton from "@/components/ui/BackButton";

export const dynamic = "force-dynamic";

export default async function MessageThreadPage({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  const { threadId } = await params;

  return (
    <AppShell contentClassName="flex-1 overflow-y-auto p-4 sm:p-5">
      <BackButton label="Back to Messages" className="mb-3" />
      <ThreadView threadId={threadId} />
    </AppShell>
  );
}

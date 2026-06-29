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
    <AppShell
      hideFooter
      contentClassName="flex min-h-0 flex-1 flex-col overflow-hidden p-3 sm:overflow-visible sm:p-4"
    >
      <BackButton label="Back to Messages" className="mb-2 shrink-0 sm:mb-3" />
      <ThreadView threadId={threadId} />
    </AppShell>
  );
}

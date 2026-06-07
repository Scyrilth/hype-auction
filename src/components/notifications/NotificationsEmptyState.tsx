export default function NotificationsEmptyState({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#1a1835] px-6 py-16 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent/15 text-accent">
        <i className="ti ti-bell text-2xl leading-none" />
      </div>
      <p className="text-base font-semibold text-white">{title}</p>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted">{subtitle}</p>
    </div>
  );
}

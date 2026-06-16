import Sidebar from "@/components/layout/Sidebar";
import SiteFooter from "@/components/layout/SiteFooter";
import TopNav from "@/components/layout/TopNav";

export default function AppShell({
  children,
  activePath,
  shellClassName = "bg-background",
  contentClassName = "flex-1 p-3 sm:p-4 lg:p-5",
}: {
  children: React.ReactNode;
  activePath?: string;
  shellClassName?: string;
  contentClassName?: string;
}) {
  return (
    <div className={`flex h-screen overflow-hidden ${shellClassName}`}>
      <Sidebar activePath={activePath} />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopNav />

        <main className="flex flex-1 flex-col overflow-y-auto">
          <div className={contentClassName}>{children}</div>
          <SiteFooter />
        </main>
      </div>
    </div>
  );
}

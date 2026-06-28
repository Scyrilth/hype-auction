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
    <div className={`min-h-screen ${shellClassName}`}>
      <Sidebar activePath={activePath} />
      <TopNav />

      <div className="min-h-screen pt-12 sm:pt-14 md:ml-52">
        <main className="flex min-h-[calc(100vh-3rem)] flex-col sm:min-h-[calc(100vh-3.5rem)]">
          <div className={contentClassName}>{children}</div>
          <SiteFooter />
        </main>
      </div>
    </div>
  );
}

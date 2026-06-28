import Sidebar from "@/components/layout/Sidebar";
import SiteFooter from "@/components/layout/SiteFooter";
import TopNavLoader from "@/components/layout/TopNavLoader";

export default function AppShell({
  children,
  activePath,
  shellClassName = "bg-background",
  contentClassName = "flex-1 p-2.5 sm:p-3 lg:p-4",
}: {
  children: React.ReactNode;
  activePath?: string;
  shellClassName?: string;
  contentClassName?: string;
}) {
  return (
    <div className={`min-h-screen ${shellClassName}`}>
      <Sidebar activePath={activePath} />
      <TopNavLoader />

      <div className="min-h-screen pt-12 md:ml-44">
        <main className="flex min-h-[calc(100vh-3rem)] flex-col">
          <div className={contentClassName}>{children}</div>
          <SiteFooter />
        </main>
      </div>
    </div>
  );
}

import SidebarNav from "@/components/layout/SidebarNav";

export default function Sidebar({ activePath }: { activePath?: string }) {
  return <SidebarNav activePath={activePath} />;
}

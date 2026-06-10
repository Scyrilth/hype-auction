import AdminGate from "@/components/admin/AdminGate";
import AdminPanel from "@/components/admin/AdminPanel";

export default function AdminPage() {
  return (
    <AdminGate>
      <AdminPanel />
    </AdminGate>
  );
}

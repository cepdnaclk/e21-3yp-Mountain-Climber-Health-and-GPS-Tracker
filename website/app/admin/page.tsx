import { createClient } from "@/lib/supabase/server";

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  // Fetch counts from the database using the new admin RLS policies.
  // The { count: 'exact', head: true } options tell Supabase we only want 
  // the number of rows, not the actual data itself (much faster).

  const { count: customersCount } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true })
    .eq("role", "customer");

  const { count: ordersCount } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true });

  const { count: registrationsCount } = await supabase
    .from("device_registrations")
    .select("*", { count: "exact", head: true });

  const { count: pendingOrdersCount } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <h1 className="admin-title">Dashboard Overview</h1>
        <p className="admin-subtitle">A high-level view of the Summit Gear platform.</p>
      </header>

      <div className="admin-stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <h3 className="stat-label">Total Customers</h3>
            <p className="stat-value">{customersCount ?? 0}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📦</div>
          <div className="stat-info">
            <h3 className="stat-label">Total Orders</h3>
            <p className="stat-value">{ordersCount ?? 0}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-info">
            <h3 className="stat-label">Pending Orders</h3>
            <p className="stat-value text-warning">{pendingOrdersCount ?? 0}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🧗</div>
          <div className="stat-info">
            <h3 className="stat-label">Registered Devices</h3>
            <p className="stat-value text-accent">{registrationsCount ?? 0}</p>
          </div>
        </div>
      </div>

      <div className="admin-welcome-card">
        <h2>👋 Welcome to the Admin Panel</h2>
        <p>
          Because you are seeing this page, the Next.js layout route protection 
          and Supabase Role-Based Access Control (RBAC) are working correctly!
        </p>
        <p>
          Use the sidebar navigation to manage different parts of the system.
          (Note: Those pages aren't built yet, but they are protected by this layout).
        </p>
      </div>
    </div>
  );
}

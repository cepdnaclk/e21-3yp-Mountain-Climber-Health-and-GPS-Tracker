import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

/**
 * Renders the hardware management dashboard for authenticated customers.
 * Displays all devices registered to the current user.
 * 
 * @component MyDevicesPage
 */


export default async function MyDevicesPage() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect("/login");
  }
  // Because of our RLS policies on device_registrations, we naturally only get their devices.
  const { data: registrations, error } = await supabase
    .from("device_registrations")
    .select(`
      id,
      registered_at,
      approved_by_admin,
      devices (
        serial_number,
        products (
          name,
          image_url
        )
      )
    `)
    .order("registered_at", { ascending: false });

  if (error) {
    return <div className="p-8 text-red-500 text-center">Error loading your devices: {error.message}</div>;
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric"
    });
  };

  return (
    <div className="orders-container">
      <div className="orders-header">
        <h1 className="orders-title">My Devices</h1>
        <p className="orders-subtitle">View and manage your registered hardware</p>
      </div>

      {!registrations || registrations.length === 0 ? (
        <div className="orders-empty">
          <p>You haven't registered any devices yet.</p>
          <Link href="/register" className="orders-shop-btn">
            Register a Device
          </Link>
        </div>
      ) : (
        <div className="grid gap-6">
          {/* @ts-ignore */}
          {registrations.map((reg) => (
            <div key={reg.id} className="order-card p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex gap-4 items-center">
                <div className="w-16 h-16 bg-card border border-border rounded-lg flex items-center justify-center text-3xl shrink-0">
                  {/* Fallback emoji based on product name */}
                  {(reg.devices as any)?.products?.name?.toLowerCase().includes('climber') ? '🧗' : 
                   (reg.devices as any)?.products?.name?.toLowerCase().includes('basecamp') ? '⛺' : '📡'}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-primary mb-1">
                    {(reg.devices as any)?.products?.name}
                  </h3>
                  <p className="font-mono text-sm text-secondary mb-1">
                    {(reg.devices as any)?.serial_number}
                  </p>
                  <p className="text-xs text-muted">
                    Registered on {formatDate(reg.registered_at)}
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-start md:items-end gap-3 w-full md:w-auto">
                {reg.approved_by_admin ? (
                  <>
                    <span className="order-status-badge status-delivered">
                      ✅ Registered
                    </span>
                    <Link 
                      href="/downloads" 
                      className="text-sm px-4 py-2 bg-accent/10 text-accent hover:bg-accent hover:text-primary-foreground border border-accent/20 rounded font-medium transition-colors w-full md:w-auto text-center"
                    >
                      Download Software
                    </Link>
                  </>
                ) : (
                  <>
                    <span className="order-status-badge status-pending">
                      ⏳ Pending Approval
                    </span>
                    <p className="text-xs text-secondary text-left md:text-right max-w-[200px]">
                      An admin is reviewing your registration. Software downloads will be unlocked soon.
                    </p>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import { createClient } from "@/lib/supabase/server";
import RegistrationRow from "./client-row";

export default async function AdminRegistrationsPage() {
  const supabase = await createClient();

  // Fetch pending registrations (where approved_by_admin is false)
  // We join with the users table and devices table to get readable names.
  const { data: pending, error } = await supabase
    .from("device_registrations")
    .select(`
      id,
      user_id,
      device_id,
      registered_at,
      approved_by_admin,
      users (
        full_name,
        email
      ),
      devices (
        serial_number,
        products (
          name
        )
      )
    `)
    .eq("approved_by_admin", false)
    .order("registered_at", { ascending: true });

  if (error) {
    return <div className="p-8 text-red-500">Error loading registrations: {error.message}</div>;
  }

  return (
    <div className="admin-content">
      <div className="admin-header">
        <h1 className="admin-title">Pending Registrations</h1>
        <p className="admin-subtitle">Review and approve customer device registration requests</p>
      </div>

      <div className="flex flex-col gap-4">
        {!pending || pending.length === 0 ? (
          <div className="admin-card p-12 text-center text-secondary border border-dashed border-border rounded-lg bg-card/50">
            No pending registration requests at this time.
          </div>
        ) : (
          // @ts-ignore
          pending.map((reg) => <RegistrationRow key={reg.id} reg={reg} />)
        )}
      </div>
    </div>
  );
}

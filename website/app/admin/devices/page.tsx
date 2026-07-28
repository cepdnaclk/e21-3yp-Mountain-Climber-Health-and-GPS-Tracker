import { createClient } from "@/lib/supabase/server";
import AddDeviceForm from "./client-form";

export default async function AdminDevicesPage() {
  const supabase = await createClient();
  const { data: products } = await supabase
    .from("products")
    .select("id, name")
    .order("name");
  const { data: devices, error } = await supabase
    .from("devices")
    .select(`
      id,
      serial_number,
      batch_id,
      status,
      created_at,
      products (
        name
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    return <div className="p-8 text-red-500">Error loading devices: {error.message}</div>;
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric"
    });
  };

  const getStatusClass = (status: string) => {
    switch(status) {
      case 'available': return 'text-emerald-500 font-medium bg-emerald-500/10 px-2 py-1 rounded-md text-xs';
      case 'registered': return 'text-blue-500 font-medium bg-blue-500/10 px-2 py-1 rounded-md text-xs';
      case 'sold': return 'text-amber-500 font-medium bg-amber-500/10 px-2 py-1 rounded-md text-xs';
      case 'deactivated': return 'text-red-500 font-medium bg-red-500/10 px-2 py-1 rounded-md text-xs';
      default: return 'text-gray-500 font-medium bg-gray-500/10 px-2 py-1 rounded-md text-xs';
    }
  };

  return (
    <div className="admin-content">
      <div className="admin-header">
        <h1 className="admin-title">Manage Devices</h1>
        <p className="admin-subtitle">Add new inventory and track hardware status</p>
      </div>

      <AddDeviceForm products={products || []} />

      <h3 className="text-lg font-bold mb-4 text-primary mt-4">Current Inventory ({devices?.length || 0})</h3>
      
      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Serial Number</th>
              <th>Product</th>
              <th>Batch ID</th>
              <th>Date Added</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {!devices || devices.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-secondary">
                  No devices in inventory yet.
                </td>
              </tr>
            ) : (
              // @ts-ignore
              devices.map((device) => (
                <tr key={device.id}>
                  <td className="font-mono font-medium text-primary">{device.serial_number}</td>
                  <td>{(device.products as any)?.name || "Unknown"}</td>
                  <td className="text-secondary">{device.batch_id || "—"}</td>
                  <td>{formatDate(device.created_at)}</td>
                  <td>
                    <span className={getStatusClass(device.status)}>
                      {device.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

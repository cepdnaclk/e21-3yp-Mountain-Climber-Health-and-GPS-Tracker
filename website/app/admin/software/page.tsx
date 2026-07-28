import { createClient } from "@/lib/supabase/server";
import UploadSoftwareForm from "./client-upload";

export default async function AdminSoftwarePage() {
  const supabase = await createClient();
  const { data: products } = await supabase
    .from("products")
    .select("id, name")
    .order("name");
  const { data: packages, error } = await supabase
    .from("software_packages")
    .select(`
      id,
      name,
      version,
      file_size_bytes,
      is_active,
      uploaded_at,
      products (
        name
      )
    `)
    .order("uploaded_at", { ascending: false });

  if (error) {
    return <div className="p-8 text-red-500">Error loading software packages: {error.message}</div>;
  }

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric"
    });
  };

  return (
    <div className="admin-content">
      <div className="admin-header">
        <h1 className="admin-title">Software Releases</h1>
        <p className="admin-subtitle">Manage firmware and application downloads for customers</p>
      </div>

      <UploadSoftwareForm products={products || []} />

      <h3 className="text-lg font-bold mb-4 text-primary mt-4">Release History</h3>
      
      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Package Name</th>
              <th>Product</th>
              <th>Version</th>
              <th>Size</th>
              <th>Uploaded</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {!packages || packages.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-secondary">
                  No software packages uploaded yet.
                </td>
              </tr>
            ) : (
              // @ts-ignore
              packages.map((pkg) => (
                <tr key={pkg.id}>
                  <td className="font-medium text-primary">{pkg.name}</td>
                  <td>{(pkg.products as any)?.name || "Unknown"}</td>
                  <td className="font-mono text-sm">{pkg.version}</td>
                  <td className="text-secondary text-sm">{formatSize(pkg.file_size_bytes)}</td>
                  <td className="text-secondary text-sm">{formatDate(pkg.uploaded_at)}</td>
                  <td>
                    {pkg.is_active ? (
                      <span className="text-emerald-500 font-medium bg-emerald-500/10 px-2 py-1 rounded-md text-xs">ACTIVE</span>
                    ) : (
                      <span className="text-red-500 font-medium bg-red-500/10 px-2 py-1 rounded-md text-xs">ARCHIVED</span>
                    )}
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

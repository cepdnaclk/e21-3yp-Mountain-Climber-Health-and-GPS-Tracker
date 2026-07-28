import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DownloadButton from "./download-button";

/**
 * Renders the software distribution center for authenticated customers.
 * Lists available firmware and client applications based on purchased hardware.
 * 
 * @component DownloadsPage
 */


export default async function CustomerDownloadsPage() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect("/login");
  }
  // CRITICAL SECURITY FEATURE: Because we set up Row Level Security (RLS) on the 
  // software_packages table, this simple select query will AUTOMATICALLY only 
  // return packages if the customer has an approved device for that product!
  const { data: packages, error } = await supabase
    .from("software_packages")
    .select(`
      id,
      name,
      version,
      description,
      file_size_bytes,
      uploaded_at,
      products (
        name
      )
    `)
    .eq("is_active", true)
    .order("uploaded_at", { ascending: false });

  if (error) {
    return <div className="p-8 text-red-500 text-center">Error loading downloads: {error.message}</div>;
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
    <div className="orders-container max-w-4xl">
      <div className="orders-header">
        <h1 className="orders-title">Software Downloads</h1>
        <p className="orders-subtitle">Access firmware updates and applications for your registered hardware</p>
      </div>

      {!packages || packages.length === 0 ? (
        <div className="orders-empty">
          <p className="mb-4">No software packages available for your registered devices.</p>
          <p className="text-sm text-muted">
            (If you just registered a device, please wait for an administrator to approve it.)
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {/* @ts-ignore */}
          {packages.map((pkg) => (
            <div key={pkg.id} className="order-card p-6 border border-border rounded-lg bg-card shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-bold rounded uppercase tracking-wider">
                      {(pkg.products as any)?.name}
                    </span>
                    <span className="text-sm text-secondary font-mono">v{pkg.version}</span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-primary mb-2">{pkg.name}</h3>
                  
                  {pkg.description && (
                    <p className="text-secondary text-sm mb-4 whitespace-pre-wrap">
                      {pkg.description}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-4 text-xs text-muted">
                    <span>Released: {formatDate(pkg.uploaded_at)}</span>
                    <span>•</span>
                    <span>Size: {formatSize(pkg.file_size_bytes)}</span>
                  </div>
                </div>

                <div className="w-full md:w-auto shrink-0 border-t border-border pt-4 md:border-none md:pt-0">
                  <DownloadButton packageId={pkg.id} />
                </div>
                
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

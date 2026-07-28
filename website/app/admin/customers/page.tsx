import { createClient } from "@/lib/supabase/server";
import CustomerList from "./client-list";

export default async function CustomersPage() {
  const supabase = await createClient();

  // Fetch all users with role 'customer'
  // (Our Admin RLS policies allow this)
  const { data: customers, error } = await supabase
    .from("users")
    .select("id, email, full_name, phone, created_at")
    .eq("role", "customer")
    .order("created_at", { ascending: false });

  if (error) {
    return <div className="p-8 text-red-500">Error loading customers: {error.message}</div>;
  }

  return <CustomerList initialCustomers={customers || []} />;
}

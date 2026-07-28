import { createClient } from "@/lib/supabase/server";
import OrderRow from "./order-row";

export default async function AdminOrdersPage() {
  const supabase = await createClient();

  // Fetch all orders with user and items data
  const { data: orders, error } = await supabase
    .from("orders")
    .select(`
      id,
      status,
      total_amount,
      created_at,
      users (
        full_name,
        email
      ),
      order_items (
        quantity,
        products (
          name
        )
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    return <div className="p-8 text-red-500">Error loading orders: {error.message}</div>;
  }

  return (
    <div className="admin-content">
      <div className="admin-header">
        <h1 className="admin-title">Orders</h1>
        <p className="admin-subtitle">Review and update customer orders</p>
      </div>

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Total</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {!orders || orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-secondary">
                  No orders found.
                </td>
              </tr>
            ) : (
              // @ts-ignore - Supabase types get messy with deep nested joins
              orders.map((order) => <OrderRow key={order.id} order={order} />)
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

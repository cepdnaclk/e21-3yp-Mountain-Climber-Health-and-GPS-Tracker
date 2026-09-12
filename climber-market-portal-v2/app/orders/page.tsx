import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

/**
 * Renders the order history dashboard for authenticated customers.
 * Fetches associated order metadata and related hardware items.
 * 
 * @component OrdersPage
 */

type OrderItem = {
  id: string;
  quantity: number;
  unit_price: number;
  products: {
    name: string;
    image_url: string;
  };
};

type Order = {
  id: string;
  status: string;
  total_amount: number;
  created_at: string;
  order_items: OrderItem[];
};

export default async function OrdersPage() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    // If not logged in, redirect them to login page
    redirect("/login");
  }
  const { data: orders, error } = await supabase
    .from("orders")
    .select(`
      id,
      status,
      total_amount,
      created_at,
      order_items (
        id,
        quantity,
        unit_price,
        products (
          name,
          image_url
        )
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="orders-container">
        <p className="orders-error">Failed to load orders: {error.message}</p>
      </div>
    );
  }
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };
  const getStatusClass = (status: string) => {
    switch (status) {
      case "pending": return "status-pending";
      case "approved": return "status-approved";
      case "shipped": return "status-shipped";
      case "delivered": return "status-delivered";
      case "cancelled": return "status-cancelled";
      default: return "status-default";
    }
  };

  return (
    <div className="orders-container">
      <div className="orders-header">
        <h1 className="orders-title">Order History</h1>
        <p className="orders-subtitle">Track your past purchases and their status</p>
      </div>

      {(!orders || orders.length === 0) ? (
        <div className="orders-empty">
          <p>You haven't placed any orders yet.</p>
          <Link href="/products" className="orders-shop-btn">
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order: any) => (
            <div key={order.id} className="order-card">
              
              {/* Top part of the card: Order info */}
              <div className="order-card-header">
                <div className="order-meta">
                  <div className="order-meta-item">
                    <span className="meta-label">Order Placed</span>
                    <span className="meta-value">{formatDate(order.created_at)}</span>
                  </div>
                  <div className="order-meta-item">
                    <span className="meta-label">Total Amount</span>
                    <span className="meta-value">${order.total_amount.toFixed(2)}</span>
                  </div>
                  <div className="order-meta-item">
                    <span className="meta-label">Order ID</span>
                    <span className="meta-value id-value">#{order.id.split("-")[0]}</span>
                  </div>
                </div>
                
                <div className="order-status-wrap">
                  <span className={`order-status-badge ${getStatusClass(order.status)}`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </div>
              </div>

              {/* Bottom part of the card: Items list */}
              <div className="order-items-list">
                {order.order_items.map((item: any) => (
                  <div key={item.id} className="order-item-row">
                    <div className="order-item-icon">📦</div>
                    <div className="order-item-details">
                      <h4 className="order-item-name">{(item.products as any)?.name || "Unknown Product"}</h4>
                      <p className="order-item-price">
                        ${item.unit_price.toFixed(2)} x {item.quantity}
                      </p>
                    </div>
                    <div className="order-item-total">
                      ${(item.unit_price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

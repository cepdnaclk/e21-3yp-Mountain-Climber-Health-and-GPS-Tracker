"use client";

import { useState } from "react";
import { updateOrderStatus } from "@/app/actions/admin";

type Order = {
  id: string;
  status: string;
  total_amount: number;
  created_at: string;
  users: {
    full_name: string;
    email: string;
  };
  order_items: {
    quantity: number;
    products: {
      name: string;
    };
  }[];
};

export default function OrderRow({ order }: { order: Order }) {
  const [status, setStatus] = useState(order.status);
  const [loading, setLoading] = useState(false);

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    setLoading(true);
    
    const result = await updateOrderStatus(order.id, newStatus);
    
    if (result.success) {
      setStatus(newStatus);
    } else {
      alert("Failed to update status: " + result.error);
      // Reset dropdown on failure
      e.target.value = status;
    }
    
    setLoading(false);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
    });
  };
  const itemsSummary = order.order_items
    .map(item => `${item.quantity}x ${item.products.name}`)
    .join(", ");

  return (
    <tr className={loading ? "opacity-50 pointer-events-none" : ""}>
      <td className="font-mono text-secondary text-sm">
        #{order.id.split("-")[0]}
      </td>
      <td>
        <div className="font-medium text-primary">{order.users?.full_name || "Unknown"}</div>
        <div className="text-xs text-secondary">{order.users?.email}</div>
      </td>
      <td className="text-sm max-w-[200px] truncate" title={itemsSummary}>
        {itemsSummary}
      </td>
      <td className="font-medium">${order.total_amount.toFixed(2)}</td>
      <td className="text-sm text-secondary">{formatDate(order.created_at)}</td>
      <td>
        <select 
          value={status} 
          onChange={handleStatusChange}
          disabled={loading}
          className={`admin-status-select status-${status}`}
        >
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </td>
    </tr>
  );
}

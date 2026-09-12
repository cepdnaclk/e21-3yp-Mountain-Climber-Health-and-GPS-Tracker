"use client";

import { useState } from "react";

type Customer = {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  created_at: string;
};

export default function CustomerList({ initialCustomers }: { initialCustomers: Customer[] }) {
  const [search, setSearch] = useState("");

  // Filter customers based on search query (name or email)
  const filtered = initialCustomers.filter((c) => {
    const query = search.toLowerCase();
    return (
      c.full_name.toLowerCase().includes(query) || 
      c.email.toLowerCase().includes(query)
    );
  });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  return (
    <div className="admin-content">
      <div className="admin-header flex-between">
        <div>
          <h1 className="admin-title">Customers</h1>
          <p className="admin-subtitle">Manage and view all registered users</p>
        </div>
        <input 
          type="text" 
          placeholder="Search name or email..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="admin-search-input"
        />
      </div>

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length > 0 ? (
              filtered.map((customer) => (
                <tr key={customer.id}>
                  <td className="font-medium text-primary">{customer.full_name || "—"}</td>
                  <td>{customer.email}</td>
                  <td>{customer.phone || "—"}</td>
                  <td>{formatDate(customer.created_at)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="text-center py-8 text-secondary">
                  No customers found matching "{search}"
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

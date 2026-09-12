"use client";

import { useState } from "react";
import { approveRegistration, rejectRegistration } from "@/app/actions/admin";

type Registration = {
  id: string;
  user_id: string;
  device_id: string;
  registered_at: string;
  approved_by_admin: boolean;
  users: {
    full_name: string;
    email: string;
  };
  devices: {
    serial_number: string;
    products: {
      name: string;
    };
  };
};

export default function RegistrationRow({ reg }: { reg: Registration }) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(reg.approved_by_admin ? "approved" : "pending");

  const handleApprove = async () => {
    setLoading(true);
    const result = await approveRegistration(reg.id, reg.device_id);
    if (result.success) {
      setStatus("approved");
    } else {
      alert("Error: " + result.error);
    }
    setLoading(false);
  };

  const handleReject = async () => {
    if (!confirm("Are you sure you want to reject and delete this registration request?")) return;
    
    setLoading(true);
    const result = await rejectRegistration(reg.id);
    if (result.success) {
      setStatus("rejected"); // Will be hidden by UI on next render or stay greyed out
    } else {
      alert("Error: " + result.error);
    }
    setLoading(false);
  };

  if (status === "rejected") return null;

  return (
    <div className={`admin-card p-5 bg-card border border-border rounded-lg flex flex-col md:flex-row justify-between gap-4 items-start md:items-center ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          <span className="font-mono font-bold text-primary bg-primary/10 px-2 py-1 rounded">
            {reg.devices?.serial_number}
          </span>
          <span className="text-sm font-medium text-secondary">
            {reg.devices?.products?.name}
          </span>
        </div>
        
        <div className="text-sm">
          <p className="text-primary font-medium">{reg.users?.full_name}</p>
          <p className="text-secondary">{reg.users?.email}</p>
          <p className="text-muted text-xs mt-1">
            Requested: {new Date(reg.registered_at).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="flex gap-2 w-full md:w-auto">
        {status === "approved" ? (
          <span className="px-4 py-2 bg-emerald-500/10 text-emerald-500 rounded font-medium border border-emerald-500/20 w-full md:w-auto text-center">
            ✅ Approved
          </span>
        ) : (
          <>
            <button 
              onClick={handleReject}
              className="flex-1 md:flex-none px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded font-medium transition-colors"
            >
              Reject
            </button>
            <button 
              onClick={handleApprove}
              className="flex-1 md:flex-none px-4 py-2 bg-accent hover:bg-accent/90 text-primary-foreground rounded font-medium transition-colors"
            >
              Approve
            </button>
          </>
        )}
      </div>
    </div>
  );
}

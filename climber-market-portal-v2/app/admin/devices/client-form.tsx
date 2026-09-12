"use client";

import { useRef, useState } from "react";
import { addDeviceStock } from "@/app/actions/admin";

type Product = {
  id: string;
  name: string;
};

export default function AddDeviceForm({ products }: { products: Product[] }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData(e.currentTarget);
    const result = await addDeviceStock(formData);

    if (result.success) {
      setSuccess(true);
      formRef.current?.reset(); // currentTarget is null after await, use ref instead
      
      // Hide success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } else {
      setError(result.error || "An unknown error occurred.");
    }
    
    setLoading(false);
  };

  return (
    <div className="admin-card p-6 bg-card border border-border rounded-lg mb-8 max-w-2xl">
      <h2 className="text-xl font-bold mb-4 text-primary">Add New Device Stock</h2>
      <p className="text-secondary mb-6 text-sm">
        Register a physical device's serial number into the system before it is shipped to a customer.
      </p>

      {success && (
        <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-md text-sm font-medium">
          ✅ Device successfully added to inventory.
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-md text-sm font-medium">
          ❌ {error}
        </div>
      )}

      <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="form-group">
          <label htmlFor="productId" className="form-label block text-sm font-medium text-secondary mb-1">
            Product Type <span className="text-red-500">*</span>
          </label>
          <select 
            name="productId" 
            id="productId" 
            required 
            className="w-full p-2.5 bg-background border border-border rounded-md text-primary outline-none focus:border-accent"
          >
            <option value="">-- Select a product --</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="serialNumber" className="form-label block text-sm font-medium text-secondary mb-1">
            Serial Number <span className="text-red-500">*</span>
          </label>
          <input 
            type="text" 
            name="serialNumber" 
            id="serialNumber" 
            required 
            placeholder="e.g. NODE-2024-001"
            className="w-full p-2.5 bg-background border border-border rounded-md text-primary outline-none focus:border-accent font-mono"
            autoComplete="off"
          />
        </div>

        <div className="form-group">
          <label htmlFor="batchId" className="form-label block text-sm font-medium text-secondary mb-1">
            Batch ID (Optional)
          </label>
          <input 
            type="text" 
            name="batchId" 
            id="batchId" 
            placeholder="e.g. BATCH-OCT-24"
            className="w-full p-2.5 bg-background border border-border rounded-md text-primary outline-none focus:border-accent"
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="mt-2 py-3 px-4 bg-accent hover:bg-accent/90 text-primary-foreground font-semibold rounded-md transition-colors disabled:opacity-50"
        >
          {loading ? "Adding Device..." : "Add to Inventory"}
        </button>
      </form>
    </div>
  );
}

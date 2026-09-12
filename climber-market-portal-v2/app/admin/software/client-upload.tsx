"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { recordSoftwarePackage } from "@/app/actions/admin";

type Product = {
  id: string;
  name: string;
};

export default function UploadSoftwareForm({ products }: { products: Product[] }) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  
  // We use the browser client to upload directly to Storage
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData(e.currentTarget);
    const productId = formData.get("productId") as string;
    const name = formData.get("name") as string;
    const version = formData.get("version") as string;
    const description = formData.get("description") as string;
    const fileExt = file.name.split('.').pop();
    const fileName = `${productId}/${Date.now()}-v${version}.${fileExt}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('software_releases')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      setError("Failed to upload file to storage: " + uploadError.message);
      setUploading(false);
      return;
    }
    const result = await recordSoftwarePackage({
      productId,
      name,
      version,
      description,
      fileUrl: uploadData.path,
      fileSizeBytes: file.size,
    });

    if (result.success) {
      setSuccess(true);
      formRef.current?.reset(); // currentTarget is null after await — use ref
      setFile(null);
      setTimeout(() => setSuccess(false), 3000);
    } else {
      setError(result.error || "Failed to save metadata.");
      // Ideally, if metadata fails, we should delete the uploaded file to prevent orphan files,
      // but we'll skip that for this tutorial to keep it simple.
    }

    setUploading(false);
  };

  return (
    <div className="admin-card p-6 bg-card border border-border rounded-lg mb-8 max-w-2xl">
      <h2 className="text-xl font-bold mb-4 text-primary">Upload Software Package</h2>
      <p className="text-secondary mb-6 text-sm">
        Upload firmware or application software. Customers will be able to download this 
        after registering a matching device.
      </p>

      {success && (
        <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-md text-sm font-medium">
          ✅ Software package successfully uploaded and published.
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-md text-sm font-medium">
          ❌ {error}
        </div>
      )}

      <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="form-group">
          <label className="form-label block text-sm font-medium text-secondary mb-1">
            Target Product <span className="text-red-500">*</span>
          </label>
          <select 
            name="productId" 
            required 
            className="w-full p-2.5 bg-background border border-border rounded-md text-primary outline-none focus:border-accent"
          >
            <option value="">-- Select a product --</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-4 flex-col md:flex-row">
          <div className="form-group flex-1">
            <label className="form-label block text-sm font-medium text-secondary mb-1">
              Package Name <span className="text-red-500">*</span>
            </label>
            <input 
              type="text" 
              name="name" 
              required 
              placeholder="e.g. Climber Node Firmware"
              className="w-full p-2.5 bg-background border border-border rounded-md text-primary outline-none focus:border-accent"
            />
          </div>
          
          <div className="form-group flex-1">
            <label className="form-label block text-sm font-medium text-secondary mb-1">
              Version <span className="text-red-500">*</span>
            </label>
            <input 
              type="text" 
              name="version" 
              required 
              placeholder="e.g. 1.2.0"
              className="w-full p-2.5 bg-background border border-border rounded-md text-primary outline-none focus:border-accent font-mono"
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label block text-sm font-medium text-secondary mb-1">
            Changelog / Description
          </label>
          <textarea 
            name="description" 
            rows={3}
            placeholder="What's new in this release?"
            className="w-full p-2.5 bg-background border border-border rounded-md text-primary outline-none focus:border-accent resize-none"
          ></textarea>
        </div>

        <div className="form-group">
          <label className="form-label block text-sm font-medium text-secondary mb-1">
            File <span className="text-red-500">*</span>
          </label>
          <div className="border-2 border-dashed border-border rounded-md p-6 text-center hover:bg-white/5 transition-colors">
            <input 
              type="file" 
              required 
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-secondary
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-accent/10 file:text-accent
                hover:file:bg-accent hover:file:text-white transition-colors"
            />
          </div>
        </div>

        <button 
          type="submit" 
          disabled={uploading || !file}
          className="mt-2 py-3 px-4 bg-accent hover:bg-accent/90 text-primary-foreground font-semibold rounded-md transition-colors disabled:opacity-50"
        >
          {uploading ? "Uploading (Please Wait)..." : "Upload Software"}
        </button>
      </form>
    </div>
  );
}

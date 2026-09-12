"use client";

import { useState } from "react";
import { getDownloadUrl } from "@/app/actions/downloads";

export default function DownloadButton({ packageId }: { packageId: string }) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    
    // Call our Server Action to generate the signed URL
    const result = await getDownloadUrl(packageId);

    if (result.success && result.signedUrl) {
      // Create a temporary link element and click it to trigger the download
      const link = document.createElement("a");
      link.href = result.signedUrl;
      link.target = "_blank"; // Open in new tab/trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      alert("Error: " + result.error);
    }
    
    setLoading(false);
  };

  return (
    <button 
      onClick={handleDownload}
      disabled={loading}
      className="px-6 py-2 bg-accent hover:bg-accent/90 text-primary-foreground font-semibold rounded-md transition-colors disabled:opacity-50 flex items-center gap-2"
    >
      {loading ? "Generating Link..." : (
        <>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
          Download
        </>
      )}
    </button>
  );
}

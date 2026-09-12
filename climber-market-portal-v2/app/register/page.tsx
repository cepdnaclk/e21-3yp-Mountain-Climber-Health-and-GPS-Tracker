"use client";

import { useState } from "react";
import { registerDevice } from "@/app/actions/register-device";
import Link from "next/link";

export default function RegisterDevicePage() {
  const [serial, setSerial] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const result = await registerDevice(serial);

    if (result.success) {
      setSuccess(true);
      setSerial("");
    } else {
      setError(result.error || "An unknown error occurred.");
    }
    
    setLoading(false);
  };

  return (
    <div className="register-container">
      <div className="register-header">
        <h1 className="register-title">Register Your Device</h1>
        <p className="register-subtitle">
          Enter your device serial number to link it to your account and unlock software downloads.
        </p>
      </div>

      <div className="register-card">
        {success ? (
          <div className="register-success text-center">
            <h2 className="text-xl font-bold text-success mb-2">✅ Registration Request Sent</h2>
            <p className="text-secondary mb-6">
              Your device has been registered successfully. An administrator will review and approve your registration soon.
            </p>
            <button 
              onClick={() => setSuccess(false)}
              className="register-btn secondary w-full"
            >
              Register Another Device
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="register-form">
            <div className="form-group">
              <label htmlFor="serial" className="form-label">
                Serial Number
              </label>
              <input
                id="serial"
                type="text"
                value={serial}
                onChange={(e) => setSerial(e.target.value)}
                placeholder="e.g. TEST-SN-9999"
                required
                className="form-input"
                autoComplete="off"
              />
              <p className="form-help">
                You can find the serial number printed on the back of your device or on the original packaging.
              </p>
            </div>

            {error && <div className="register-error">{error}</div>}

            <button
              type="submit"
              disabled={loading || !serial.trim()}
              className="register-btn w-full mt-4"
            >
              {loading ? "Verifying..." : "Register Device"}
            </button>
          </form>
        )}
      </div>

      <div className="mt-8 text-center">
        <Link href="/products" className="auth-link">
          &larr; Back to Catalog
        </Link>
      </div>
    </div>
  );
}

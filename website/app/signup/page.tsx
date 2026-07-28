"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

// "use client" because this component has interactivity:
// form inputs, button clicks, state changes.

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); // Prevent the browser from refreshing the page
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const fullName = formData.get("fullName") as string;

    const supabase = createClient();

    // signUp() creates a new user in auth.users.
    // The database trigger we set up will automatically create
    // a matching row in public.users with role='customer'.
    // We pass full_name in the metadata so the trigger can read it.
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // If email confirmation is OFF, the user is logged in immediately.
    // If email confirmation is ON, they need to check their email first.
    setSuccess(true);
    setLoading(false);

    // Redirect after a short delay so they can see the success message
    setTimeout(() => router.push("/"), 1500);
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">
            Join Summit Gear to purchase and manage your mountain safety devices
          </p>
        </div>

        {success ? (
          <div className="auth-success">
            ✅ Account created! Redirecting...
          </div>
        ) : (
          <form onSubmit={handleSignup} className="auth-form">
            <div className="form-group">
              <label htmlFor="fullName" className="form-label">Full Name</label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                required
                placeholder="Enter your full name"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="email" className="form-label">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="you@example.com"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={6}
                placeholder="At least 6 characters"
                className="form-input"
              />
            </div>

            {error && (
              <div className="auth-error">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="auth-button"
            >
              {loading ? "Creating account..." : "Sign Up"}
            </button>
          </form>
        )}

        <p className="auth-footer">
          Already have an account?{" "}
          <Link href="/login" className="auth-link">Log in</Link>
        </p>
      </div>
    </div>
  );
}

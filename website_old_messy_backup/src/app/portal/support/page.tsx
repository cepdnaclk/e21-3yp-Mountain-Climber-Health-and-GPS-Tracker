"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import PortalLayout from "@/components/PortalLayout";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type BasecampAccount = {
  id: string;
  basecamp_code: string;
  name: string;
  location: string | null;
  contact_email: string;
  status: string;
};

type SupportTicket = {
  id: string;
  issue_type: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
};

const supportCategories = [
  "Basecamp software installation",
  "COM port / USB serial connection",
  "Climber ESP32 firmware issue",
  "LoRa communication problem",
  "Flutter mobile app connection",
  "Armband BLE detection",
  "Repeater node setup",
  "Device registration issue",
  "Firmware version/download issue",
];

export default function SupportPage() {
  const supabase = createSupabaseBrowserClient();

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [basecamps, setBasecamps] = useState<BasecampAccount[]>([]);
  const [selectedBasecampId, setSelectedBasecampId] = useState("");

  const [tickets, setTickets] = useState<SupportTicket[]>([]);

  const [issueType, setIssueType] = useState(supportCategories[0]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadUserData() {
      setIsCheckingAuth(true);
      setIsLoadingData(true);
      setErrorMessage("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setIsAuthenticated(false);
        setIsCheckingAuth(false);
        setIsLoadingData(false);
        return;
      }

      setIsAuthenticated(true);

      const { data: basecampData, error: basecampError } = await supabase
        .from("basecamp_accounts")
        .select("*")
        .order("created_at", { ascending: true });

      if (basecampError) {
        console.error("Basecamp load error:", basecampError);
        setErrorMessage("Could not load your basecamp accounts.");
        setIsCheckingAuth(false);
        setIsLoadingData(false);
        return;
      }

      const loadedBasecamps = basecampData ?? [];
      setBasecamps(loadedBasecamps);

      const firstBasecampId = loadedBasecamps[0]?.id ?? "";
      setSelectedBasecampId(firstBasecampId);

      if (firstBasecampId) {
        await loadTickets(firstBasecampId);
      } else {
        setIsLoadingData(false);
      }

      setIsCheckingAuth(false);
    }

    loadUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadTickets(basecampAccountId: string) {
    setIsLoadingData(true);
    setErrorMessage("");

    const { data, error } = await supabase
      .from("support_tickets")
      .select("*")
      .eq("basecamp_account_id", basecampAccountId)
      .order("created_at", { ascending: false });

    setIsLoadingData(false);

    if (error) {
      console.error("Support tickets load error:", error);
      setErrorMessage("Could not load support tickets.");
      return;
    }

    setTickets(data ?? []);
  }

  async function handleBasecampChange(basecampAccountId: string) {
    setSelectedBasecampId(basecampAccountId);
    setSuccessMessage("");
    setErrorMessage("");

    if (basecampAccountId) {
      await loadTickets(basecampAccountId);
    } else {
      setTickets([]);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSuccessMessage("");
    setErrorMessage("");

    if (
      !selectedBasecampId ||
      !issueType.trim() ||
      !title.trim() ||
      !description.trim()
    ) {
      setErrorMessage("Please select a basecamp and fill all support fields.");
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase.from("support_tickets").insert({
      basecamp_account_id: selectedBasecampId,
      issue_type: issueType.trim(),
      title: title.trim(),
      description: description.trim(),
      status: "OPEN",
    });

    setIsSubmitting(false);

    if (error) {
      setErrorMessage("Support request could not be submitted. Please try again.");
      console.error("Support form error:", error);
      return;
    }

    setSuccessMessage("Support request submitted successfully.");
    setTitle("");
    setDescription("");

    await loadTickets(selectedBasecampId);
  }

  if (isCheckingAuth) {
    return (
      <PortalLayout
        title="Support"
        description="Checking portal authentication..."
      >
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-slate-300 sm:p-6">
          Checking login status...
        </div>
      </PortalLayout>
    );
  }

  if (!isAuthenticated) {
    return (
      <PortalLayout
        title="Support"
        description="Login is required to submit support tickets under a real basecamp account."
      >
        <div className="rounded-2xl border border-orange-400/30 bg-orange-400/10 p-5 sm:p-6">
          <h2 className="text-2xl font-bold">Login Required</h2>

          <p className="mt-3 leading-7 text-slate-300">
            Support tickets are linked to real basecamp accounts. Please login
            or create a basecamp account before submitting support requests.
          </p>

          <div className="mt-6 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/login"
              className="rounded-xl bg-emerald-400 px-5 py-3 text-center font-semibold text-slate-950 hover:bg-emerald-300"
            >
              Login
            </Link>

            <Link
              href="/register"
              className="rounded-xl border border-white/10 px-5 py-3 text-center font-semibold text-white hover:bg-white/10"
            >
              Create Basecamp Account
            </Link>
          </div>
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout
      title="Support"
      description="Submit support tickets linked to your real basecamp account."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6">
          <h2 className="text-2xl font-bold">Support Categories</h2>

          <p className="mt-2 text-sm leading-6 text-slate-400">
            Choose the closest category when reporting installation, firmware,
            device, or deployment issues.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {supportCategories.map((item) => (
              <div
                key={item}
                className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-slate-300"
              >
                {item}
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-5">
            <h3 className="text-xl font-bold">Support Scope</h3>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              This portal support system is for product setup, software
              packages, firmware versions, device registration, and customer
              support. Live climber tracking and SOS monitoring remain local at
              the basecamp.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6">
          <h2 className="text-2xl font-bold">Support Request Form</h2>

          <p className="mt-2 text-sm text-slate-400">
            Submit a support request under your selected basecamp account.
          </p>

          {basecamps.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-orange-400/30 bg-orange-400/10 p-5">
              <h3 className="text-xl font-bold">No Basecamp Account Found</h3>

              <p className="mt-3 text-sm leading-6 text-slate-300">
                Your login exists, but no basecamp profile was found. Create a
                basecamp account first before submitting support tickets.
              </p>

              <Link
                href="/register"
                className="mt-5 inline-block rounded-xl bg-emerald-400 px-5 py-3 font-semibold text-slate-950 hover:bg-emerald-300"
              >
                Create Basecamp Account
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
              <div>
                <label className="text-sm text-slate-300">
                  Basecamp Account
                </label>
                <select
                  value={selectedBasecampId}
                  onChange={(event) => handleBasecampChange(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-emerald-400"
                >
                  {basecamps.map((basecamp) => (
                    <option key={basecamp.id} value={basecamp.id}>
                      {basecamp.name} — {basecamp.basecamp_code}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm text-slate-300">Issue Type</label>
                <select
                  value={issueType}
                  onChange={(event) => setIssueType(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-emerald-400"
                >
                  {supportCategories.map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm text-slate-300">Issue Title</label>
                <input
                  type="text"
                  placeholder="Example: Basecamp node not detected on USB"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="text-sm text-slate-300">Description</label>
                <textarea
                  rows={5}
                  placeholder="Describe the issue clearly"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-emerald-400"
                />
              </div>

              {successMessage && (
                <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300">
                  {successMessage}
                </div>
              )}

              {errorMessage && (
                <div className="rounded-xl border border-orange-400/30 bg-orange-400/10 px-4 py-3 text-sm text-orange-300">
                  {errorMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl bg-emerald-400 px-6 py-3 font-semibold text-slate-950 hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Submitting..." : "Submit Support Request"}
              </button>
            </form>
          )}
        </div>
      </div>

      {basecamps.length > 0 && (
        <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6">
          <h2 className="text-2xl font-bold">Your Support Tickets</h2>

          {isLoadingData && (
            <p className="mt-4 text-slate-300">Loading support tickets...</p>
          )}

          {!isLoadingData && tickets.length === 0 && (
            <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950 p-5">
              <p className="text-slate-300">
                No support tickets submitted under this basecamp yet.
              </p>
            </div>
          )}

          {!isLoadingData && tickets.length > 0 && (
            <div className="mt-5 grid gap-4">
              {tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="rounded-2xl border border-white/10 bg-slate-950 p-5"
                >
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-slate-500">
                        {ticket.issue_type}
                      </p>

                      <h3 className="mt-1 break-words text-lg font-bold">
                        {ticket.title}
                      </h3>
                    </div>

                    <span className="w-fit rounded-full bg-emerald-400/10 px-4 py-2 text-xs font-semibold text-emerald-300">
                      {ticket.status}
                    </span>
                  </div>

                  <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-6 text-slate-300">
                    {ticket.description}
                  </p>

                  <p className="mt-4 text-xs text-slate-500">
                    Created: {new Date(ticket.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </PortalLayout>
  );
}
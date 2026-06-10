import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-20">
      <p className="text-sm font-semibold uppercase tracking-wide text-emerald-400">
        Offline-first climber safety platform
      </p>

      <h1 className="mt-4 max-w-4xl text-5xl font-black leading-tight md:text-7xl">
        Mountain climber safety tracking for remote basecamps.
      </h1>

      <p className="mt-6 max-w-3xl text-xl leading-9 text-slate-300">
        MountainSafety supports verified basecamp owners with device
        registration, firmware downloads, local dashboard packages, mobile app
        access, and support tickets. Live climber monitoring remains local using
        ESP32, LoRa, USB serial, and the Flask dashboard.
      </p>

      <div className="mt-10 flex flex-wrap gap-4">
        <Link
          href="/register"
          className="rounded-xl bg-emerald-400 px-6 py-3 font-bold text-slate-950"
        >
          Request Basecamp Access
        </Link>

        <Link
          href="/login"
          className="rounded-xl border border-white/15 px-6 py-3 font-bold"
        >
          Login to Portal
        </Link>
      </div>

      <section className="mt-20 grid gap-5 md:grid-cols-3">
        {[
          ["Main Climber Device", "ESP32, GPS, LoRa, SOS, OLED, battery status."],
          ["Basecamp Device", "ESP32 LoRa gateway connected to local laptop."],
          ["Mobile App", "Climber-side local app connected through Wi-Fi AP."],
          ["Web Dashboard", "Local Flask dashboard for live monitoring."],
          ["Repeater Node", "Optional LoRa repeater for extended range."],
          ["Product Portal", "Verified access, devices, downloads, support."],
        ].map(([title, body]) => (
          <div key={title} className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-xl font-bold">{title}</h2>
            <p className="mt-3 text-slate-400">{body}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
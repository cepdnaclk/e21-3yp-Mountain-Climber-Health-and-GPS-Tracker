import PortalLayout from "@/components/PortalLayout";

const installerFeatures = [
  {
    title: "Local Flask Dashboard",
    description:
      "The current live monitoring dashboard will be packaged into an installable basecamp application.",
  },
  {
    title: "USB Serial Communication",
    description:
      "The basecamp ESP32 LoRa node connects to the laptop by USB serial and sends LoRa packet data to the dashboard.",
  },
  {
    title: "Climber Monitoring",
    description:
      "The dashboard shows climber status, GPS location, SOS state, battery state, messages, alerts, and online/offline status.",
  },
  {
    title: "Basecamp Commands",
    description:
      "The operator can send messages, clear SOS, set basecamp GPS, and send base location updates through LoRa.",
  },
  {
    title: "Session Log Export",
    description:
      "Operational events such as SOS, messages, GPS setup, and basecamp actions can be exported as CSV logs.",
  },
  {
    title: "Offline-First Operation",
    description:
      "The basecamp dashboard should run locally even without internet access. The online portal is only for downloads, setup, and updates.",
  },
];

const installerSteps = [
  "Download MountainSafetyBasecamp_Setup_v1.0.0.exe from the portal",
  "Run installer on the basecamp laptop",
  "Connect the basecamp ESP32 LoRa node by USB",
  "Open MountainSafety Basecamp from desktop shortcut",
  "Auto-detect or select COM port",
  "Confirm serial connection and LoRa node status",
  "Turn on climber devices and start monitoring",
];

const futurePackageFiles = [
  "MountainSafetyBasecamp.exe",
  "config.json",
  "local_database.db",
  "logs/",
  "firmware/",
  "docs/",
  "drivers/",
];

export default function BasecampSoftwarePage() {
  return (
    <PortalLayout
      title="Basecamp Software"
      description="This page explains how the current Flask basecamp dashboard will later be packaged as an easy installer for non-technical basecamp users."
    >
      <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-6">
        <h2 className="text-2xl font-bold">Production Goal</h2>
        <p className="mt-3 leading-7 text-slate-300">
          The final basecamp user should not run Python commands or edit app.py.
          They should download an installer, connect the basecamp ESP32 LoRa
          node, open the dashboard, and start monitoring climber devices.
        </p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-bold">Installer Workflow</h2>

          <div className="mt-5 grid gap-3">
            {installerSteps.map((step, index) => (
              <div
                key={step}
                className="flex gap-4 rounded-xl border border-white/10 bg-slate-950 p-4"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-400 font-bold text-slate-950">
                  {index + 1}
                </div>
                <p className="text-sm text-slate-300">{step}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-bold">Demo Installer Panel</h2>
          <p className="mt-2 text-sm text-slate-400">
            This is UI only. The actual Windows installer will be built later.
          </p>

          <div className="mt-6 grid gap-4">
            <div>
              <label className="text-sm text-slate-300">Package Name</label>
              <input
                type="text"
                defaultValue="MountainSafetyBasecamp_Setup_v1.0.0.exe"
                className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-emerald-400"
              />
            </div>

            <div>
              <label className="text-sm text-slate-300">Target Platform</label>
              <select className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-emerald-400">
                <option>Windows Laptop - Basecamp Operator</option>
                <option>macOS - Development Testing</option>
                <option>Linux - Future Support</option>
              </select>
            </div>

            <div>
              <label className="text-sm text-slate-300">Serial Port Mode</label>
              <select className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-emerald-400">
                <option>Auto Detect</option>
                <option>Manual COM Port</option>
                <option>COM30 Demo Configuration</option>
              </select>
            </div>

            <button
              type="button"
              className="rounded-xl bg-emerald-400 px-6 py-3 font-semibold text-slate-950 hover:bg-emerald-300"
            >
              Download Installer
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {installerFeatures.map((feature) => (
          <div
            key={feature.title}
            className="rounded-2xl border border-white/10 bg-white/5 p-6"
          >
            <h2 className="text-xl font-bold">{feature.title}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              {feature.description}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-2xl font-bold">Future Installed Folder Structure</h2>
        <p className="mt-3 leading-7 text-slate-300">
          The packaged software can later install files into a clean application
          folder instead of asking the user to manage Python files manually.
        </p>

        <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {futurePackageFiles.map((file) => (
            <div
              key={file}
              className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-slate-300"
            >
              {file}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-2xl font-bold">Recommended Packaging Path</h2>
        <p className="mt-3 leading-7 text-slate-300">
          Keep the current Flask dashboard for now. Later, package it using
          PyInstaller and create a Windows installer using Inno Setup. The user
          should see only a desktop shortcut and simple setup wizard, not Python,
          terminal commands, or source files.
        </p>
      </div>
    </PortalLayout>
  );
}
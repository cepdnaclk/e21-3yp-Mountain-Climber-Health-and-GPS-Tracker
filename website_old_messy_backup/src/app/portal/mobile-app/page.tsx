import PortalLayout from "@/components/PortalLayout";

const appFeatures = [
  {
    title: "ESP32 Wi-Fi API Connection",
    description:
      "The mobile app connects to the climber ESP32 access point and communicates with the local API at 192.168.4.1.",
  },
  {
    title: "GPS Fallback",
    description:
      "The phone can provide GPS coordinates to the climber ESP32 when needed, helping improve location reliability.",
  },
  {
    title: "SOS Control",
    description:
      "The climber can send SOS and clear SOS through the mobile app interface.",
  },
  {
    title: "Short Messages",
    description:
      "The climber can send predefined quick messages or custom short messages to the basecamp through the ESP32 and LoRa path.",
  },
  {
    title: "Armband BLE Data",
    description:
      "The app can scan for the CLIMBER_ARMBAND BLE advertisement and forward BPM, sensor state, and armband battery data.",
  },
  {
    title: "Device Status",
    description:
      "The app displays ESP32 API status, LoRa status, GPS state, battery, RSSI/SNR, distance, and latest basecamp message.",
  },
];

const setupSteps = [
  "Download MountainSafetyClimber_v1.0.0.apk from the portal",
  "Install APK on Android phone",
  "Allow GPS permission",
  "Allow Bluetooth permission",
  "Connect phone to climber ESP32 Wi-Fi access point",
  "Open Climber Safety app",
  "Check ESP32 API connection",
  "Send test message to basecamp",
  "Test SOS workflow safely",
];

const apiEndpoints = [
  {
    endpoint: "/status",
    purpose: "Read climber ESP32 status, GPS, LoRa, SOS, battery, and messages",
  },
  {
    endpoint: "/gps",
    purpose: "Post phone GPS fallback data to the climber ESP32",
  },
  {
    endpoint: "/bpm",
    purpose: "Post BPM, armband battery, and sensor state to the climber ESP32",
  },
  {
    endpoint: "/send",
    purpose: "Send a short climber message to the ESP32 for LoRa forwarding",
  },
  {
    endpoint: "/sos",
    purpose: "Send SOS request from mobile app",
  },
  {
    endpoint: "/clear-sos",
    purpose: "Clear SOS state from mobile app",
  },
];

const packageInfo = [
  {
    label: "Future APK Name",
    value: "MountainSafetyClimber_v1.0.0.apk",
  },
  {
    label: "Current App Role",
    value: "Flutter mobile companion app",
  },
  {
    label: "Connection Target",
    value: "http://192.168.4.1",
  },
  {
    label: "Supported Platform",
    value: "Android first",
  },
];

export default function MobileAppPage() {
  return (
    <PortalLayout
      title="Mobile App"
      description="This page explains how the current Flutter app will later be packaged as an Android APK for climbers."
    >
      <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-6">
        <h2 className="text-2xl font-bold">Production Goal</h2>
        <p className="mt-3 leading-7 text-slate-300">
          The final user should not run Flutter commands or open source code.
          They should download the Android APK, install it, connect to the
          climber ESP32 Wi-Fi access point, and use the app for status, GPS
          fallback, messages, SOS, and armband data.
        </p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-bold">APK Setup Workflow</h2>

          <div className="mt-5 grid gap-3">
            {setupSteps.map((step, index) => (
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
          <h2 className="text-2xl font-bold">Mobile App Package</h2>

          <div className="mt-5 grid gap-3">
            {packageInfo.map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-white/10 bg-slate-950 p-4"
              >
                <p className="text-sm text-slate-400">{item.label}</p>
                <p className="mt-1 font-semibold">{item.value}</p>
              </div>
            ))}
          </div>

          <button
            type="button"
            className="mt-6 w-full rounded-xl bg-emerald-400 px-6 py-3 font-semibold text-slate-950 hover:bg-emerald-300"
          >
            Download APK
          </button>

          <p className="mt-3 text-sm text-slate-400">
            UI only. Real APK download will be connected later through portal
            storage.
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {appFeatures.map((feature) => (
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
        <h2 className="text-2xl font-bold">Current ESP32 API Endpoints</h2>
        <p className="mt-3 leading-7 text-slate-300">
          The current Flutter app communicates with the climber ESP32 local API.
          These endpoints should be documented clearly for production testing
          and troubleshooting.
        </p>

        <div className="mt-5 grid gap-3">
          {apiEndpoints.map((api) => (
            <div
              key={api.endpoint}
              className="grid gap-3 rounded-xl border border-white/10 bg-slate-950 p-4 md:grid-cols-[140px_1fr]"
            >
              <p className="font-mono text-sm font-semibold text-emerald-300">
                {api.endpoint}
              </p>
              <p className="text-sm text-slate-300">{api.purpose}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-2xl font-bold">Future Distribution Path</h2>
        <p className="mt-3 leading-7 text-slate-300">
          First production testing can use direct APK download from the portal.
          Later, the app can be published through Google Play for easier updates,
          but the portal should still keep setup guides and compatibility notes.
        </p>
      </div>
    </PortalLayout>
  );
}
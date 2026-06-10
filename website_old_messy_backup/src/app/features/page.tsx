import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const features = [
  {
    title: "NEO-6M GPS Tracking",
    description:
      "The climber device uses a NEO-6M GPS module to collect live location data and send it to the basecamp dashboard through LoRa.",
  },
  {
    title: "Phone GPS Fallback",
    description:
      "When the NEO-6M GPS has no fix, the Flutter mobile app can provide phone GPS coordinates to the climber ESP32 through the Wi-Fi AP.",
  },
  {
    title: "LoRa Off-Grid Communication",
    description:
      "The system uses SX1278/Ra-02 LoRa modules for communication between the climber device and basecamp node without depending on cellular networks.",
  },
  {
    title: "SOS Alert System",
    description:
      "SOS can be triggered from the hardware button or mobile app and is shown immediately on the basecamp dashboard alert panel.",
  },
  {
    title: "Clear SOS Workflow",
    description:
      "SOS can be cleared from the climber device hardware button or from the basecamp dashboard after the emergency state is handled.",
  },
  {
    title: "Check-In / I Am OK Button",
    description:
      "The climber device supports a check-in button so climbers can quickly notify basecamp that they are safe.",
  },
  {
    title: "Two-Way Messaging",
    description:
      "The climber can send messages through the mobile app, and the basecamp operator can reply from the web dashboard.",
  },
  {
    title: "OLED Status Display",
    description:
      "The main climber device includes an OLED display to show important device and communication status in the field.",
  },
  {
    title: "Basecamp Web Dashboard",
    description:
      "The local Flask dashboard shows climber status, alerts, GPS map, conversation panel, basecamp GPS setup, and session logs.",
  },
  {
    title: "Flutter Mobile App",
    description:
      "The mobile app connects to the climber ESP32 Wi-Fi AP and provides status, SOS, quick messages, phone GPS fallback, and armband status.",
  },
  {
    title: "Multi-Climber Ready",
    description:
      "The dashboard is designed around unique climber IDs, making it ready for larger multi-climber deployments.",
  },
  {
    title: "Session Log Export",
    description:
      "The basecamp dashboard keeps an operational session log and supports CSV export for review and documentation.",
  },
  {
    title: "Alert Panel",
    description:
      "The dashboard can highlight SOS, GPS lost, offline device, and low battery conditions for basecamp operators.",
  },
  {
    title: "GPS Jitter Filtering",
    description:
      "Map path updates are filtered to reduce false movement caused by GPS jitter.",
  },
  {
    title: "Future Health Monitoring",
    description:
      "The ESP32-H2 armband is prepared for MAX30102 heart-rate sensor integration as a future health monitoring upgrade.",
  },
];

const dashboardItems = [
  "Multi-climber cards",
  "Alert panel",
  "Distance map",
  "Conversation panel",
  "Session log export",
  "Basecamp GPS setup",
];

const appItems = [
  "Status view",
  "SOS button",
  "Quick messages",
  "Phone GPS fallback",
  "Distance from basecamp",
  "Armband status",
];

export default function FeaturesPage() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
        <section className="mx-auto max-w-7xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-300">
            Features
          </p>

          <h1 className="mt-4 max-w-5xl text-4xl font-bold sm:text-6xl">
            Stable features of the current LoRa-based safety system.
          </h1>

          <p className="mt-6 max-w-4xl text-lg leading-8 text-slate-300">
            The current stable system is a working off-grid climber tracking and
            safety communication prototype. It supports GPS tracking, phone GPS
            fallback, LoRa communication, SOS alerts, check-in, two-way messages,
            dashboard monitoring, mobile app support, and session logging.
          </p>

          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-white/10 bg-white/5 p-6"
              >
                <h2 className="text-xl font-semibold">{feature.title}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-12 grid gap-8 lg:grid-cols-2">
            <div className="rounded-3xl border border-emerald-400/30 bg-emerald-400/10 p-6">
              <h2 className="text-2xl font-bold">Web Dashboard Features</h2>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {dashboardItems.map((item) => (
                  <div
                    key={item}
                    className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-slate-300"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-2xl font-bold">Mobile App Features</h2>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {appItems.map((item) => (
                  <div
                    key={item}
                    className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-slate-300"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const storyCards = [
  {
    title: "The Problem",
    description:
      "Mountain activities can become dangerous when climbers move into areas with weak or unavailable mobile network coverage. In these situations, basecamp operators need a way to track location, receive emergency alerts, and communicate with climbers without depending on cellular service.",
  },
  {
    title: "The Solution",
    description:
      "MountainSafety is designed as an offline-first LoRa-based safety system. It combines climber ESP32 devices, a basecamp ESP32 LoRa node, a local Flask dashboard, and a Flutter mobile app to support GPS tracking, SOS alerts, and short messages.",
  },
  {
    title: "Why LoRa",
    description:
      "LoRa was selected because the system needs long-range low-power communication in remote outdoor environments. The goal is to keep the field system working locally even when internet or mobile data is unavailable.",
  },
];

const currentSystem = [
  "Climber ESP32 firmware with GPS, LoRa, Wi-Fi API, SOS, OLED, and battery support",
  "Basecamp ESP32 LoRa firmware connected to laptop through USB serial",
  "Local Flask dashboard for live basecamp monitoring",
  "Flutter mobile companion app connected to the climber ESP32 Wi-Fi API",
  "ESP32-H2 armband prototype module for BLE-based BPM data",
  "Future LoRa repeater node for range extension",
];

const productVision = [
  "Basecamp users register through the online portal",
  "Users download a packaged basecamp software installer",
  "Firmware is distributed as .bin packages through a firmware updater",
  "The Flutter app is distributed as an Android APK",
  "Setup guides help non-technical users install and operate the system",
  "Repeater nodes extend communication range in mountain terrain",
];

const principles = [
  {
    title: "Offline First",
    text: "The live safety system should work locally at the basecamp without requiring internet access.",
  },
  {
    title: "Simple for Users",
    text: "Final customers should not need Arduino IDE, Python commands, or Flutter development knowledge.",
  },
  {
    title: "Modular Design",
    text: "Firmware, basecamp software, mobile app, repeater, and portal should be developed as separate modules.",
  },
  {
    title: "Production Path",
    text: "The project should move from prototype code to packaged software, firmware releases, documentation, and support.",
  },
];

export default function AboutPage() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
        <section className="mx-auto max-w-7xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-300">
            About the Project
          </p>

          <h1 className="mt-4 max-w-5xl text-4xl font-bold sm:text-6xl">
            A university prototype moving toward a real mountain safety product.
          </h1>

          <p className="mt-6 max-w-4xl text-lg leading-8 text-slate-300">
            MountainSafety started as a Mountain Climber IoT Safety Tracking
            System. The project focuses on helping climbers, hiking guides,
            basecamp operators, and rescue teams communicate and monitor safety
            in remote mountain environments where mobile coverage may be weak or
            unavailable.
          </p>

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {storyCards.map((card) => (
              <div
                key={card.title}
                className="rounded-3xl border border-white/10 bg-white/5 p-6"
              >
                <h2 className="text-2xl font-bold">{card.title}</h2>
                <p className="mt-4 text-sm leading-7 text-slate-300">
                  {card.description}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-12 grid gap-8 lg:grid-cols-2">
            <div className="rounded-3xl border border-emerald-400/30 bg-emerald-400/10 p-6">
              <h2 className="text-2xl font-bold">Current Technical System</h2>

              <div className="mt-5 grid gap-3">
                {currentSystem.map((item) => (
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
              <h2 className="text-2xl font-bold">Product Vision</h2>

              <div className="mt-5 grid gap-3">
                {productVision.map((item) => (
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

          <div className="mt-12">
            <h2 className="text-3xl font-bold">Design Principles</h2>

            <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {principles.map((principle) => (
                <div
                  key={principle.title}
                  className="rounded-2xl border border-white/10 bg-white/5 p-6"
                >
                  <h3 className="text-xl font-bold">{principle.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-300">
                    {principle.text}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-12 rounded-3xl bg-white p-6 text-slate-950">
            <h2 className="text-2xl font-bold">Current Development Focus</h2>
            <p className="mt-3 leading-7 text-slate-600">
              The current focus is to keep improving the climber firmware,
              basecamp LoRa firmware, Flutter app, local Flask dashboard, and
              circuit design while also starting the product website and customer
              portal prototype. The next major hardware stage is the LoRa
              repeater node.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
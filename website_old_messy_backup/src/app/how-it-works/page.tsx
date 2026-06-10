import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const steps = [
  {
    number: "01",
    title: "Climber device collects field data",
    description:
      "The climber device collects GPS location, battery information, SOS state, and messages from the climber side.",
  },
  {
    number: "02",
    title: "Data is transmitted using LoRa",
    description:
      "The climber device sends compact packets through LoRa to the basecamp node. This is designed for outdoor areas with weak or unavailable mobile coverage.",
  },
  {
    number: "03",
    title: "Basecamp node connects to laptop",
    description:
      "The basecamp LoRa node receives packets and sends them to the laptop through USB serial communication.",
  },
  {
    number: "04",
    title: "Dashboard displays climber status",
    description:
      "The basecamp dashboard displays location, alert status, messages, and system information for the operator.",
  },
  {
    number: "05",
    title: "Repeater node extends range",
    description:
      "The planned repeater node will forward packets between climbers and the basecamp when direct LoRa communication is limited by terrain.",
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
        <section className="mx-auto max-w-7xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-300">
            How It Works
          </p>
          <h1 className="mt-4 max-w-4xl text-4xl font-bold sm:text-6xl">
            From climber device to basecamp dashboard.
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">
            The system is designed as an offline-first safety network. The live
            basecamp monitoring dashboard runs locally using Flask and USB serial
            communication with the basecamp ESP32 LoRa node. The online website is
            only a product website and future customer portal prototype at this
            stage.
          </p>

          <div className="mt-14 grid gap-6">
            {steps.map((step) => (
              <div
                key={step.number}
                className="grid gap-6 rounded-3xl border border-white/10 bg-white/5 p-6 md:grid-cols-[120px_1fr]"
              >
                <div className="text-5xl font-bold text-emerald-300">
                  {step.number}
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{step.title}</h2>
                  <p className="mt-3 max-w-3xl leading-7 text-slate-300">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-14 rounded-3xl border border-emerald-400/30 bg-emerald-400/10 p-6">
            <h2 className="text-2xl font-bold">System data flow</h2>
            <p className="mt-4 leading-7 text-slate-300">
              Armband ESP32-H2 → BLE Advertisement → Flutter App / Climber ESP32 →
              HTTP Wi-Fi API → Climber ESP32 → LoRa → Optional Repeater Node →
              Basecamp ESP32 LoRa Node → USB Serial → Local Flask Basecamp Dashboard
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
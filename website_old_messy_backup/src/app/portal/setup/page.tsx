import PortalLayout from "@/components/PortalLayout";

const setupSteps = [
  {
    step: "01",
    title: "Create Basecamp Account",
    status: "Future Portal Feature",
    description:
      "The basecamp operator will register on the online portal and create a basecamp profile with location and contact details.",
    checklist: [
      "Create user account",
      "Create basecamp profile",
      "Receive Basecamp ID",
      "Assign kit serial number",
    ],
  },
  {
    step: "02",
    title: "Download Basecamp Software",
    status: "Portal Package",
    description:
      "The user downloads the packaged basecamp software installer instead of downloading raw Python Flask files.",
    checklist: [
      "Download MountainSafetyBasecamp_Setup.exe",
      "Download setup guide",
      "Check supported Windows version",
      "Install software on basecamp laptop",
    ],
  },
  {
    step: "03",
    title: "Connect Basecamp ESP32 LoRa Node",
    status: "Hardware Setup",
    description:
      "The basecamp ESP32 LoRa gateway connects to the laptop by USB serial and communicates with the local Flask dashboard.",
    checklist: [
      "Connect USB cable",
      "Detect COM port",
      "Confirm serial connection",
      "Check LoRa gateway status",
    ],
  },
  {
    step: "04",
    title: "Install Climber Mobile App",
    status: "Mobile Setup",
    description:
      "The climber installs the Android app and connects the phone to the climber ESP32 Wi-Fi access point.",
    checklist: [
      "Install APK",
      "Allow GPS permission",
      "Allow Bluetooth permission",
      "Connect to climber ESP32 Wi-Fi",
    ],
  },
  {
    step: "05",
    title: "Power On Climber Device",
    status: "Field Device Setup",
    description:
      "The climber ESP32 device starts GPS, LoRa, Wi-Fi API, SOS handling, OLED display, and mobile app communication.",
    checklist: [
      "Power on climber device",
      "Check OLED status",
      "Check GPS state",
      "Check LoRa ready state",
    ],
  },
  {
    step: "06",
    title: "Start Local Monitoring",
    status: "Operational Step",
    description:
      "The basecamp operator opens the local dashboard and monitors climber location, SOS, messages, battery, RSSI/SNR, and event logs.",
    checklist: [
      "Open local dashboard",
      "Confirm climber appears online",
      "Send test message",
      "Test SOS clear workflow",
    ],
  },
  {
    step: "07",
    title: "Add Repeater Node",
    status: "Next Development Stage",
    description:
      "The repeater node will be added later to extend LoRa range between climber devices and the basecamp gateway.",
    checklist: [
      "Place repeater at suitable high point",
      "Power on repeater",
      "Check packet forwarding",
      "Confirm dashboard path status",
    ],
  },
];

export default function SetupPage() {
  return (
    <PortalLayout
      title="Setup Workflow"
      description="This page shows the planned non-technical setup journey for future basecamp users. The goal is to make installation possible without Arduino IDE, Python commands, or Flutter development knowledge."
    >
      <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-6">
        <h2 className="text-2xl font-bold">Product Setup Goal</h2>
        <p className="mt-3 leading-7 text-slate-300">
          In production, the basecamp user should only need to register, download
          the package, install the basecamp software, connect the LoRa gateway,
          install the mobile app, turn on climber devices, and start monitoring.
        </p>
      </div>

      <div className="mt-8 grid gap-6">
        {setupSteps.map((item) => (
          <div
            key={item.step}
            className="rounded-2xl border border-white/10 bg-white/5 p-6"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex gap-5">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-400 text-xl font-bold text-slate-950">
                  {item.step}
                </div>

                <div>
                  <h2 className="text-2xl font-bold">{item.title}</h2>
                  <p className="mt-3 max-w-4xl leading-7 text-slate-300">
                    {item.description}
                  </p>
                </div>
              </div>

              <span className="w-fit rounded-full bg-white/10 px-4 py-2 text-sm text-slate-300">
                {item.status}
              </span>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              {item.checklist.map((point) => (
                <div
                  key={point}
                  className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-slate-300"
                >
                  {point}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </PortalLayout>
  );
}
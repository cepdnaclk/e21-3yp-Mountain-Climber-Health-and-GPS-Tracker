import PortalLayout from "@/components/PortalLayout";

const docs = [
  {
    title: "Basecamp Software Setup Guide",
    status: "Draft",
    description:
      "Explains how a basecamp operator will install the packaged local dashboard, connect the basecamp ESP32 LoRa node through USB, and start monitoring climbers.",
    sections: [
      "Install Basecamp Software",
      "Connect Basecamp LoRa Gateway",
      "Select COM Port / Auto Detect",
      "Open Local Dashboard",
      "Confirm Serial Connection",
    ],
  },
  {
    title: "Climber Device Setup Guide",
    status: "Draft",
    description:
      "Explains how to power on the climber device, check GPS/LoRa/OLED status, connect the mobile app, and test SOS and messaging.",
    sections: [
      "Power On Climber Device",
      "Check OLED Status",
      "Connect Phone to ESP32 Wi-Fi AP",
      "Open Flutter Mobile App",
      "Test GPS, Message, and SOS",
    ],
  },
  {
    title: "Flutter Mobile App Connection Guide",
    status: "Draft",
    description:
      "Explains how the climber mobile app connects to the ESP32 local Wi-Fi API at 192.168.4.1 and uses endpoints for status, GPS fallback, BPM, messages, SOS, and SOS clear.",
    sections: [
      "Connect to Climber Wi-Fi",
      "Open Climber Safety App",
      "Allow GPS and Bluetooth Permissions",
      "Check ESP32 API Status",
      "Send Test Message",
    ],
  },
  {
    title: "Firmware Update Guide",
    status: "Planned",
    description:
      "Explains how production users will update ESP32 firmware using a simple firmware updater instead of Arduino IDE.",
    sections: [
      "Open Firmware Updater",
      "Select Device Type",
      "Connect Device by USB",
      "Flash Firmware Package",
      "Verify Firmware Version",
    ],
  },
  {
    title: "Repeater Node Setup Guide",
    status: "Next Development Stage",
    description:
      "Explains how the future LoRa repeater node will be placed between climber and basecamp to extend communication range in mountainous terrain.",
    sections: [
      "Place Repeater at High Visibility Point",
      "Power On Repeater",
      "Check LoRa Status LED",
      "Test Climber to Basecamp Packet Path",
      "Confirm Dashboard Shows Repeater Path",
    ],
  },
  {
    title: "Troubleshooting Guide",
    status: "Draft",
    description:
      "Common fixes for basecamp serial connection, LoRa packet loss, mobile app connection, GPS issues, armband BLE detection, and SOS/message problems.",
    sections: [
      "Basecamp Serial Not Connected",
      "Phone Cannot Connect to ESP32 Wi-Fi",
      "No GPS Found",
      "LoRa Message Not Received",
      "Armband Not Detected",
    ],
  },
];

export default function DocsPage() {
  return (
    <PortalLayout
      title="Documentation"
      description="This page is a prototype documentation center. In the production portal, basecamp users will download setup guides, troubleshooting guides, and device manuals from here."
    >
      <div className="grid gap-6">
        {docs.map((doc) => (
          <div
            key={doc.title}
            className="rounded-2xl border border-white/10 bg-white/5 p-6"
          >
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
              <div>
                <h2 className="text-2xl font-bold">{doc.title}</h2>
                <p className="mt-3 max-w-4xl leading-7 text-slate-300">
                  {doc.description}
                </p>
              </div>

              <span className="w-fit rounded-full bg-white/10 px-4 py-2 text-sm text-slate-300">
                {doc.status}
              </span>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {doc.sections.map((section) => (
                <div
                  key={section}
                  className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-slate-300"
                >
                  {section}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </PortalLayout>
  );
}
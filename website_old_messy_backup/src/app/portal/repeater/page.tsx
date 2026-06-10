import PortalLayout from "@/components/PortalLayout";

const repeaterGoals = [
  {
    title: "Extend LoRa Range",
    description:
      "Forward packets between climber devices and the basecamp LoRa node when direct communication is weak due to terrain.",
  },
  {
    title: "Avoid Duplicate Packets",
    description:
      "Track message IDs or sequence numbers so the same packet is not forwarded repeatedly.",
  },
  {
    title: "Support Two-Way Messages",
    description:
      "Forward packets from climber to basecamp and later support basecamp replies back to climber devices.",
  },
  {
    title: "Report Signal Path",
    description:
      "Future dashboard updates can show whether a packet arrived directly or through a repeater node.",
  },
  {
    title: "Low-Power Outdoor Use",
    description:
      "The repeater should be designed for battery-powered or solar-assisted use in a weather-resistant enclosure.",
  },
  {
    title: "Simple Field Status",
    description:
      "Use basic LED indicators for power, LoRa receive, LoRa transmit, and error state.",
  },
];

const firmwareTasks = [
  "Receive LoRa packet",
  "Read source device ID",
  "Read message ID or sequence number",
  "Check duplicate packet cache",
  "Increment hop count",
  "Add repeater ID",
  "Forward packet to basecamp",
  "Forward basecamp reply back to climber",
  "Send heartbeat/status packet",
];

const packetFields = [
  { field: "SRC", meaning: "Original sender ID, for example CLIMBER-001" },
  { field: "DST", meaning: "Target device ID, for example BASE-001" },
  { field: "TYPE", meaning: "DATA, MSG, SOS, SOS_CLEAR, BASE, HEARTBEAT" },
  { field: "SEQ/MID", meaning: "Sequence or message ID for duplicate filtering" },
  { field: "HOPS", meaning: "Number of repeater hops used by the packet" },
  { field: "RELAY", meaning: "Repeater node ID, for example REPEATER-001" },
  { field: "RSSI/SNR", meaning: "Signal quality values for dashboard diagnostics" },
];

const hardwareItems = [
  "ESP32 development board",
  "SX1278 / Ra-02 LoRa module",
  "433 MHz antenna",
  "Battery system",
  "Optional solar charging module",
  "Power switch",
  "Status LEDs",
  "Weather-resistant enclosure",
];

export default function RepeaterPage() {
  return (
    <PortalLayout
      title="Repeater Node"
      description="This page explains the next hardware and firmware development stage: a LoRa repeater node for extending communication range in mountain terrain."
    >
      <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-6">
        <h2 className="text-2xl font-bold">Repeater Development Goal</h2>
        <p className="mt-3 leading-7 text-slate-300">
          The repeater node should sit between climber devices and the basecamp
          LoRa gateway. Its job is only to receive, filter, and forward LoRa
          packets. It should not include unnecessary sensors or complex user
          interfaces.
        </p>
      </div>

      <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-2xl font-bold">Target Data Flow</h2>

        <div className="mt-6 grid gap-3 text-sm text-slate-300">
          <div className="rounded-xl bg-slate-950 px-4 py-3">
            Climber ESP32 Device
          </div>
          <div className="text-center text-emerald-300">↓ LoRa</div>
          <div className="rounded-xl bg-slate-950 px-4 py-3">
            Repeater Node REPEATER-001
          </div>
          <div className="text-center text-emerald-300">↓ LoRa</div>
          <div className="rounded-xl bg-slate-950 px-4 py-3">
            Basecamp ESP32 LoRa Node
          </div>
          <div className="text-center text-emerald-300">↓ USB Serial</div>
          <div className="rounded-xl bg-slate-950 px-4 py-3">
            Local Flask Basecamp Dashboard
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {repeaterGoals.map((goal) => (
          <div
            key={goal.title}
            className="rounded-2xl border border-white/10 bg-white/5 p-6"
          >
            <h2 className="text-xl font-bold">{goal.title}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              {goal.description}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-bold">Firmware Responsibilities</h2>

          <div className="mt-5 grid gap-3">
            {firmwareTasks.map((task, index) => (
              <div
                key={task}
                className="flex gap-4 rounded-xl border border-white/10 bg-slate-950 p-4"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-400 font-bold text-slate-950">
                  {index + 1}
                </div>
                <p className="text-sm text-slate-300">{task}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-bold">Recommended Hardware</h2>

          <div className="mt-5 grid gap-3">
            {hardwareItems.map((item) => (
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

      <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-2xl font-bold">Suggested Packet Fields</h2>
        <p className="mt-3 leading-7 text-slate-300">
          The repeater firmware should use packet fields that make debugging
          easier. This helps the basecamp dashboard later show whether data came
          directly or through a repeater.
        </p>

        <div className="mt-5 overflow-hidden rounded-xl border border-white/10">
          <div className="grid grid-cols-2 bg-white/10 px-4 py-3 text-sm font-semibold text-slate-300">
            <p>Field</p>
            <p>Meaning</p>
          </div>

          {packetFields.map((row) => (
            <div
              key={row.field}
              className="grid grid-cols-2 border-t border-white/10 px-4 py-3 text-sm"
            >
              <p className="font-mono font-semibold text-emerald-300">
                {row.field}
              </p>
              <p className="text-slate-300">{row.meaning}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-2xl font-bold">Dashboard Updates Needed Later</h2>
        <p className="mt-3 leading-7 text-slate-300">
          After repeater firmware works, the local Flask dashboard can be updated
          to show signal path, repeater ID, hop count, RSSI/SNR, and whether the
          climber packet arrived directly or through a repeater.
        </p>
      </div>
    </PortalLayout>
  );
}
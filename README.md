# Mountain Climber IoT Safety Tracking System

<p align="center">
  <strong>An off-grid IoT-based safety tracking, health monitoring, and emergency communication system for mountain climbers and basecamp rescue teams.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Status-Completed-brightgreen" alt="Project Status">
  <img src="https://img.shields.io/badge/Platform-IoT-blue" alt="IoT Platform">
  <img src="https://img.shields.io/badge/Communication-LoRa%20433MHz-green" alt="LoRa Communication">
  <img src="https://img.shields.io/badge/Range-15km+-orange" alt="Range">
  <img src="https://img.shields.io/badge/Mesh-Repeater%20Supported-yellow" alt="Mesh Support">
  <img src="https://img.shields.io/badge/Dashboard-Flask%20%2B%20Leaflet-lightgrey" alt="Flask Dashboard">
  <img src="https://img.shields.io/badge/Mobile%20App-Flutter-blueviolet" alt="Flutter Mobile App">
  <img src="https://img.shields.io/badge/Portal-Next.js%2016-black" alt="Next.js Portal">
</p>

---

## Overview

The **Mountain Climber IoT Safety Tracking System** is a third-year engineering project (CO328 / 3YP, Group 23) developed at the Department of Computer Engineering, University of Peradeniya. It provides a complete end-to-end IoT solution for climber safety in remote mountain environments where cellular networks are unavailable.

### Why This System?

Commercial alternatives like Garmin inReach ($400 + $15-65/month subscription) and SPOT X ($250 + monthly fees) rely on expensive satellite networks. Our system uses **LoRa 433MHz** — a free ISM band — achieving **15km+ range** at **zero recurring cost** (~$50-80 BOM per node). It is also the **only system in its class that integrates real-time health monitoring** via a BLE wearable armband.

---

## Key Features

| Feature | Description |
| --- | --- |
| **GPS Tracking** | NEO-6M module with smart jitter filtering (rejects <12m movement, >80m jumps, low-satellite, high-HDOP fixes) |
| **LoRa Communication** | 433MHz, SF=8, BW=125kHz, 17dBm TX — bidirectional with CRC validation |
| **Mesh Repeater** | LoRa repeater nodes extend range around ridges and obstacles with TTL-limited multi-hop forwarding |
| **SOS Emergency Alert** | Hardware panic button triggers accelerated telemetry (3s → 1s intervals) with retry mechanism |
| **Health Monitoring** | BLE wearable armband with MAX30102 heart rate sensor, relayed via mobile app |
| **Two-Way Messaging** | Short text messages between climber and basecamp over LoRa |
| **Phone GPS Fallback** | Mobile app injects phone GPS when hardware GPS has no fix |
| **Web Dashboard** | Real-time Leaflet map, multi-climber tracking, SOS alerts, session logs with CSV export |
| **Mobile Companion App** | Flutter app with BLE, GPS relay, distance map, SOS controls, and quick-message chips |
| **OTA Firmware Updates** | ESP32 ArduinoOTA support for field firmware updates via WiFi |
| **Hardware Watchdog** | Auto-recovery from firmware hangs via ESP32 task watchdog timer |
| **Collision Avoidance** | Listen-Before-Talk (LBT) for multi-climber LoRa channel sharing |
| **Dynamic Device IDs** | MAC-derived unique IDs — no hardcoded limits on climber count |
| **Summit Gear Portal** | Next.js commercial web portal for device sales, serial registration, and firmware distribution |

---

## System Architecture

```
┌─────────────────────────────────┐
│     🏷️ Wearable Armband         │
│     ESP32-H2 · BLE · MAX30102   │
│     (Heart rate, Battery)       │
└──────────────┬──────────────────┘
               │ BLE Advertising
               ▼
┌─────────────────────────────────┐
│     📱 Mobile Companion App     │
│     Flutter · Dart              │
│     BLE relay · Phone GPS       │
└──────────────┬──────────────────┘
               │ WiFi SoftAP HTTP
               ▼
┌─────────────────────────────────┐
│     📡 Climber Main Device      │
│     ESP32 · LoRa · NEO-6M GPS  │
│     OLED · 3 Buttons · OTA     │
└──────────────┬──────────────────┘
               │ LoRa 433MHz (15km+)
               ▼
┌─────────────────────────────────┐
│     🔁 LoRa Repeater Node       │  ← Optional mesh relay
│     ESP32 · SX1278              │
└──────────────┬──────────────────┘
               │ LoRa 433MHz
               ▼
┌─────────────────────────────────┐
│     📻 Basecamp LoRa Node       │
│     ESP32 · SX1278 · USB Serial │
└──────────────┬──────────────────┘
               │ USB Serial 115200
               ▼
┌─────────────────────────────────┐
│     🖥️ Web Dashboard            │
│     Python Flask · SQLite       │
│     Leaflet Map · Session Logs  │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│     🌐 Summit Gear Portal       │
│     Next.js 16 · Supabase       │
│     Device Registration · FW DL │
└─────────────────────────────────┘
```

---

## Repository Structure

```
.
├── final_ARDUINO_firmware/          # All ESP32 firmware sketches
│   ├── Climber main device/         #   Main climber device (GPS, LoRa, OLED, WiFi AP)
│   ├── Basecamp/                    #   Basecamp LoRa-to-Serial bridge
│   ├── Repeater/                    #   LoRa mesh repeater node
│   └── Wristband/                   #   BLE health monitoring armband
│
├── climber_app/                     # Flutter mobile companion app
│   ├── lib/main.dart                #   App source code
│   ├── android/                     #   Android platform config
│   ├── ios/                         #   iOS platform config
│   └── pubspec.yaml                 #   Dependencies
│
├── MountainSafety_Dashboard/        # Python Flask basecamp dashboard
│   ├── app.py                       #   Flask server + embedded frontend
│   ├── test_app.py                  #   Pytest test suite
│   ├── requirements.txt             #   Python dependencies
│   └── release/                     #   Windows executable builds
│
├── docs/                            # GitHub Pages project website
│   ├── README.md                    #   Project page content (Jekyll)
│   └── data/index.json              #   Team metadata
│
├── .github/workflows/tests.yml     # CI/CD: pytest on push/PR
└── README.md                        # This file
```

---

## Hardware Components

### Main Climber Device

| Component | Specification |
| --- | --- |
| ESP32 Development Board | Dual-core 240MHz, WiFi + BLE, 520KB SRAM |
| SX1278 / Ra-02 LoRa Module | 433MHz, SF=8, BW=125kHz, CR=4/5, 17dBm TX |
| NEO-6M GPS Module | UART @ 9600 baud, parsed via TinyGPSPlus |
| SSD1306 OLED Display | 128x64 I2C, shows GPS/LoRa/SOS/battery status |
| 3× Push Buttons | SOS (Pin 32), Clear SOS (Pin 33), Check-in OK (Pin 25) |
| Rechargeable Battery | Portable LiPo with ADC monitoring (Pin 34) |

### Basecamp Node

| Component | Purpose |
| --- | --- |
| ESP32 + SX1278 LoRa | Bidirectional LoRa ↔ USB Serial bridge |
| USB Serial @ 115200 | JSON line protocol to laptop dashboard |

### LoRa Repeater Node

| Component | Purpose |
| --- | --- |
| ESP32 + SX1278 LoRa | Multi-hop mesh relay with TTL-limited forwarding |

### Wearable Armband

| Component | Purpose |
| --- | --- |
| ESP32-H2 (RISC-V) | BLE-only wearable controller |
| MAX30102 Sensor | Heart rate and SpO2 monitoring |
| LiPo Battery | Wearable power source |

---

## Software Stack

| Component | Technology |
| --- | --- |
| Climber Firmware | Arduino C++ for ESP32 (ArduinoOTA, TinyGPSPlus, LoRa, SSD1306) |
| Basecamp Firmware | Arduino C++ for ESP32 (LoRa, Serial JSON bridge) |
| Repeater Firmware | Arduino C++ for ESP32 (LoRa mesh relay) |
| Armband Firmware | Arduino C++ for ESP32-H2 (BLE advertising) |
| Web Dashboard | Python Flask, PySerial, SQLite, Leaflet.js, HTML5 Canvas |
| Mobile App | Flutter 3.12, Dart, flutter_blue_plus, geolocator, flutter_map |
| Summit Gear Portal | Next.js 16, React 19, TypeScript, Tailwind CSS v4, Supabase |
| CI/CD | GitHub Actions (pytest on Python 3.11) |

---

## Getting Started

### Firmware

1. Install [Arduino IDE](https://www.arduino.cc/en/software) with ESP32 board support
2. Open the sketch from `final_ARDUINO_firmware/<device>/`
3. Install required libraries: `LoRa`, `TinyGPSPlus`, `SSD1306AsciiWire`, `ArduinoOTA`
4. Select the correct board (ESP32 Dev Module or ESP32-H2) and upload

### Web Dashboard

```bash
cd MountainSafety_Dashboard
pip install -r requirements.txt
python app.py
# Dashboard opens at http://127.0.0.1:5000
```

### Mobile App

```bash
cd climber_app
flutter pub get
flutter run
```

### Summit Gear Portal

```bash
# See climber-market-portal-v2/ (separate repository)
cd climber-market-portal-v2
npm install
# Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local
npm run dev
```

---

## Testing

### Automated Tests

```bash
# Dashboard unit tests (also runs in GitHub Actions CI)
cd MountainSafety_Dashboard
pytest --maxfail=3 -v

# Flutter widget tests
cd climber_app
flutter test
```

### Test Coverage

- **Haversine distance calculation** — verified against known coordinates
- **GPS point acceptance** — jitter filtering, jump detection, satellite/HDOP thresholds
- **Duplicate packet detection** — bounded deque-based sliding window
- **Alert generation** — SOS, GPS loss, offline, low battery conditions
- **CSV export** — correct formatting and line breaks
- **XSS sanitization** — HTML entity escaping in dashboard
- **Packet ID validation** — alphanumeric format enforcement

---

## Team Members

| Registration No. | Name | Email |
| --- | --- | --- |
| E/21/198 | Sahan Jayasundara | [e21198@eng.pdn.ac.lk](mailto:e21198@eng.pdn.ac.lk) |
| E/21/328 | Prabash Rathnayaka | [e21328@eng.pdn.ac.lk](mailto:e21328@eng.pdn.ac.lk) |
| E/21/353 | Pasan Sandeep | [e21353@eng.pdn.ac.lk](mailto:e21353@eng.pdn.ac.lk) |

**Supervisors:** Ms. Yashodha Vimukthi, Thiliru Samaradiwakara

---

## Project Links

| Resource | Link |
| --- | --- |
| GitHub Repository | [cepdnaclk/e21-3yp-Mountain-Climber-Health-and-GPS-Tracker](https://github.com/cepdnaclk/e21-3yp-Mountain-Climber-Health-and-GPS-Tracker) |
| Project Page | [GitHub Pages Site](https://cepdnaclk.github.io/e21-3yp-Mountain-Climber-Health-and-GPS-Tracker/) |
| Department | [Department of Computer Engineering](http://www.ce.pdn.ac.lk/) |
| University | [Faculty of Engineering, University of Peradeniya](https://eng.pdn.ac.lk/) |

---

## Future Roadmap

- [ ] LoRa packet encryption (AES-128) for secure communication
- [ ] Custom PCB design with impedance-matched RF traces
- [ ] IP67-rated weather-resistant enclosure
- [ ] Low-temperature rated batteries (LiSOCl₂) for extreme cold
- [ ] Solar-powered repeater nodes for permanent trail coverage
- [ ] Accelerometer-based fall/avalanche detection
- [ ] FCC/CE RF certification for commercial deployment
- [ ] Cloud sync when basecamp has Starlink/cellular connectivity

---

<p align="center">
  <strong>Mountain Climber IoT Safety Tracking System</strong><br>
  Department of Computer Engineering<br>
  Faculty of Engineering, University of Peradeniya
</p>
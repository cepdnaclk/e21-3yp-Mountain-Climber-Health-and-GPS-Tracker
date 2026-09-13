---
layout: home
permalink: index.html

# Updated variables
repository-name: e21-3yp-Mountain-Climber-Health-and-GPS-Tracker
title: Mountain Climber IoT Safety Tracking System
---

<link rel="stylesheet" href="./assets/css/style.css">

<div class="wrapper"> <!-- Start of wrapper for better readability -->

# Mountain Climber IoT Safety Tracking System

<p align="center">
  <strong>An off-grid IoT-based safety tracking, health monitoring, and emergency communication system for mountain climbers and basecamp rescue teams.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Status-Completed-brightgreen" alt="Project Status">
  <img src="https://img.shields.io/badge/Platform-IoT-blue" alt="IoT Platform">
  <img src="https://img.shields.io/badge/Communication-LoRa%20433MHz-green" alt="LoRa Communication">
  <img src="https://img.shields.io/badge/Range-15km+-orange" alt="Range">
  <img src="https://img.shields.io/badge/Dashboard-Flask%20%2B%20Leaflet-lightgrey" alt="Flask Dashboard">
  <img src="https://img.shields.io/badge/Mobile%20App-Flutter-blueviolet" alt="Flutter Mobile App">
  <img src="https://img.shields.io/badge/Portal-Next.js%2016-black" alt="Next.js Portal">
</p>

<p align="center">
  <strong>🛒 <a href="https://summit-gear-portal.vercel.app" target="_blank">View the Live E-Commerce Portal (Summit Gear)</a></strong>
</p>

---

## Table of Contents

1. [Overview](#overview)
2. [Problem Statement](#problem-statement)
3. [Solution & Competitive Advantage](#solution--competitive-advantage)
4. [System Architecture](#system-architecture)
5. [Key Features](#key-features)
6. [Hardware Components](#hardware-components)
7. [Software Stack](#software-stack)
8. [Communication Protocols](#communication-protocols)
9. [Web Dashboard](#web-dashboard)
10. [Mobile Application](#mobile-application)
11. [Summit Gear Commercial Portal](#summit-gear-commercial-portal)
12. [Testing & Quality Assurance](#testing--quality-assurance)
13. [Getting Started](#getting-started)
14. [Team](#team)
15. [Links](#links)
16. [Future Roadmap](#future-roadmap)

---

## 🎥 Project Demonstration

[![Watch the video](https://img.youtube.com/vi/YOUR_VIDEO_ID/maxresdefault.jpg)](https://youtu.be/YOUR_VIDEO_ID)
*(Edit this README to replace YOUR_VIDEO_ID with your actual YouTube video ID)*

---

## Overview

The **Mountain Climber IoT Safety Tracking System** is a comprehensive embedded and IoT-based project developed at the Department of Computer Engineering, University of Peradeniya (CO328 / 3YP, Group 23). It provides real-time GPS tracking, SOS emergency alerts, two-way messaging, health monitoring, and basecamp rescue coordination for climbers operating in remote environments where cellular networks are unavailable.

---

## Problem Statement

Mountain climbers and expedition teams face critical communication challenges in remote environments:

> [!WARNING]  
> **No cellular coverage** in mountainous terrain, deep valleys, and high altitudes.

> [!IMPORTANT]  
> **Limited satellite options** are expensive ($400+ hardware, $15-65/month subscriptions) and **no integrated health monitoring** exists in current off-grid devices.

---

## Solution & Competitive Advantage

Our system uses **LoRa 433MHz** — a free ISM band — to achieve **15km+ line-of-sight range** at **zero recurring subscription cost**.

| Feature | Garmin inReach | SPOT X | Meshtastic | **Our System** |
| --- | --- | --- | --- | --- |
| Communication | Iridium Satellite | Globalstar Satellite | LoRa | **LoRa 433MHz** |
| Range | Global | Near-global | 1-10km mesh | **15km+ with mesh** |
| Health Monitoring | No | No | No | **Yes (BLE HR)** |
| Hardware Cost | $400 | $250 | $30-50 | **~$50-80** |
| Monthly Subscription | $15-65 | $15-30 | Free | **Free** |
| Mesh Repeater | No | No | Yes | **Yes** |
| Commercial Portal | No | No | No | **Yes** |

**Key differentiators:**
1. Only system with **integrated health monitoring** via BLE wearable armband
2. **Zero subscription fees** — LoRa operates on free ISM band
3. **Mesh repeater support** for extending range around obstacles
4. **Commercial web portal** for device sales, registration, and firmware distribution
5. **Extremely low cost** — accessible for developing-world mountaineering communities

---

## System Architecture

```text
┌─────────────────────────────────┐
│     Wearable Armband            │
│     ESP32-H2 · BLE · MAX30102  │
└──────────────┬──────────────────┘
               │ BLE Advertising
               ▼
┌─────────────────────────────────┐
│     Mobile Companion App        │
│     Flutter · Dart              │
└──────────────┬──────────────────┘
               │ WiFi SoftAP HTTP
               ▼
┌─────────────────────────────────┐
│     Climber Main Device         │
│     ESP32 · LoRa · GPS · OLED  │
└──────────────┬──────────────────┘
               │ LoRa 433MHz
               ▼
┌─────────────────────────────────┐
│     LoRa Repeater (Optional)    │
│     ESP32 · SX1278              │
└──────────────┬──────────────────┘
               │ LoRa 433MHz
               ▼
┌─────────────────────────────────┐
│     Basecamp LoRa Node          │
│     ESP32 · SX1278 · USB       │
└──────────────┬──────────────────┘
               │ USB Serial
               ▼
┌─────────────────────────────────┐
│     Basecamp Web Dashboard      │
│     Flask · Leaflet · SQLite    │
└─────────────────────────────────┘
```

### Data Flow

- **GPS Tracking**: NEO-6M → ESP32 → LoRa → Basecamp → Dashboard
- **SOS Alert**: Hardware Button → Accelerated LoRa TX (1s interval) → Dashboard Alert Panel
- **Phone GPS Fallback**: Phone Geolocator → WiFi AP → ESP32 → LoRa → Dashboard
- **Health Data**: MAX30102 → ESP32-H2 BLE → Phone App → WiFi → Climber ESP32 → LoRa → Dashboard
- **Two-Way Messaging**: Dashboard ↔ Serial ↔ Basecamp LoRa ↔ Climber ↔ Mobile App

---

## Key Features

| Feature | Description |
| --- | --- |
| GPS Tracking with Smart Filtering | Rejects jitter (<12m), jumps (>80m/15s), low-satellite (<5), high-HDOP (>3.0) readings |
| LoRa Communication | SF=8, BW=125kHz, CR=4/5, TX=17dBm with CRC validation |
| Mesh Repeater Network | TTL-limited multi-hop forwarding with Listen-Before-Talk collision avoidance |
| SOS Emergency System | Hardware panic button with accelerated telemetry and retry mechanism |
| Health Monitoring | BLE wearable armband with heart rate sensor, relayed through mobile app |
| Two-Way Messaging | Short text messages with quick-message chips and custom input |
| Phone GPS Fallback | Automatic when hardware GPS has no fix |
| OTA Firmware Updates | ArduinoOTA support for field updates via WiFi SoftAP |
| Hardware Watchdog | ESP32 task watchdog timer for automatic crash recovery |
| Dynamic Device IDs | MAC-derived unique identifiers for unlimited climber scaling |
| Multi-Climber Dashboard | Real-time Leaflet map, breadcrumb trails, per-climber cards |
| Session Export | CSV log export for documentation and rescue reports |
| Commercial Portal | Next.js web portal for device registration and firmware distribution |

---

## Hardware Components

### Main Climber Device

| Component | Specification |
| --- | --- |
| ESP32 Development Board | Dual-core 240MHz, WiFi + BLE, 520KB SRAM |
| SX1278 / Ra-02 LoRa | 433MHz, SPI (SCK:18, MISO:19, MOSI:23, SS:5, RST:14, DIO0:26) |
| NEO-6M GPS | UART2 (RX:16, TX:17) @ 9600 baud, TinyGPSPlus parsing |
| SSD1306 OLED | 128×64 I2C (SDA:21, SCL:22, Addr: 0x3C) |
| Push Buttons | SOS (Pin 32), Clear SOS (Pin 33), Check-in (Pin 25) — INPUT_PULLUP |
| Battery ADC | Pin 34 with voltage divider |

### Basecamp Node
ESP32 + SX1278 LoRa (same SPI pins) + USB Serial @ 115200 baud

### LoRa Repeater Node
ESP32 + SX1278 LoRa — autonomous mesh relay with duplicate filtering and TTL management

### Wearable Armband
ESP32-H2 (RISC-V, BLE/Zigbee/Thread) + MAX30102 pulse oximeter + LiPo battery

---

## Software Stack

| Component | Technology |
| --- | --- |
| Firmware (4 devices) | Arduino C/C++ for ESP32/ESP32-H2 |
| Web Dashboard | Python Flask, PySerial, SQLite, Leaflet.js |
| Mobile App | Flutter 3.12, Dart, flutter_blue_plus, geolocator, flutter_map |
| Commercial Portal | Next.js 16, React 19, TypeScript, Tailwind CSS v4, Supabase |
| CI/CD | GitHub Actions (pytest, Python 3.11) |

---

## Communication Protocols

### LoRa Packet Format

```text
TYPE:DATA,ID:CLM-A4F2,LAT:7.253061,LON:80.592154,ALT:1250,BAT:87,SOS:0,
BPM:72,ABAT:90,RSSI:-45,SNR:8.5,GPS:FIX,SAT:8,SEQ:42,TTL:3
```

### LoRa Configuration

| Parameter | Value |
| --- | --- |
| Frequency | 433 MHz (ISM Band) |
| Spreading Factor | 8 |
| Bandwidth | 125 kHz |
| Coding Rate | 4/5 |
| TX Power | 17 dBm |
| CRC | Enabled |

---

## Web Dashboard

![Basecamp Dashboard](images/dashboard.png)
*(Drop your dashboard screenshot in `docs/images/dashboard.png`)*

The basecamp web dashboard provides real-time monitoring and rescue coordination:

- **Multi-climber tracking** with individual cards showing GPS, battery, SOS status, and health data
- **Leaflet map** with climber markers, breadcrumb trails, and basecamp reference point
- **Alert panel** with CRITICAL (SOS, GPS loss) and WARNING (offline, low battery) categories
- **Two-way messaging** with conversation history
- **Session log** with filterable event table and CSV export
- **Serial port auto-detection** with manual selection fallback

---

## Mobile Application

![Mobile App](images/mobile-app.png)
*(Drop your mobile app screenshot in `docs/images/mobile-app.png`)*

The Flutter companion app connects to the climber device via WiFi SoftAP:

- **Status dashboard** with color-coded safety banner (Green/Orange/Red/Grey)
- **Distance map** using flutter_map with real-time climber and basecamp positions
- **BLE armband integration** for heart rate monitoring
- **Quick-message chips** ("I am OK", "Need help", "Injured", etc.)
- **SOS controls** with dedicated send and clear buttons
- **Connection indicators** for ESP32, BLE, and GPS status

---

## Summit Gear Commercial Portal

![Summit Gear Portal](images/portal.png)
*(Drop your e-commerce portal screenshot in `docs/images/portal.png`)*

A Next.js web application providing full device lifecycle management:

- **Product catalog** with hardware specifications and pricing
- **Shopping cart** with persistent state
- **Device registration** — customers bind physical serial numbers to their accounts
- **Admin panel** — order management, device inventory, registration approval
- **Firmware distribution** — signed download URLs for registered devices only
- **Audit logging** — all admin actions tracked

---

## Testing & Quality Assurance

| Test Category | Tools | Coverage |
| --- | --- | --- |
| Dashboard Unit Tests | pytest | Haversine, duplicate detection, alerts, GPS acceptance, CSV export, XSS sanitization |
| Flutter Widget Tests | flutter test | App initialization, widget tree smoke tests |
| CI/CD Pipeline | GitHub Actions | Automated pytest on every push/PR |
| LoRa Range Testing | Field testing | Verified 15km+ line-of-sight in mountain terrain |
| GPS Accuracy | Field testing | Jitter filter validation with real-world movement data |

---

## Getting Started

### Prerequisites
- Arduino IDE with ESP32 board support
- Python 3.11+ with pip
- Flutter SDK 3.12+
- Node.js 18+ (for Summit Gear Portal)

### Quick Start

```bash
# Clone the repository
git clone https://github.com/cepdnaclk/e21-3yp-Mountain-Climber-Health-and-GPS-Tracker.git
cd e21-3yp-Mountain-Climber-Health-and-GPS-Tracker

# Run the dashboard
cd MountainSafety_Dashboard
pip install -r requirements.txt
python app.py

# Run the mobile app
cd ../climber_app
flutter pub get
flutter run

# Run tests
cd ../MountainSafety_Dashboard
pytest -v
```

---

## Team

| Registration No. | Name | Email |
| --- | --- | --- |
| E/21/198 | Sahan Jayasundara | [e21198@eng.pdn.ac.lk](mailto:e21198@eng.pdn.ac.lk) |
| E/21/328 | Prabash Rathnayaka | [e21328@eng.pdn.ac.lk](mailto:e21328@eng.pdn.ac.lk) |
| E/21/353 | Pasan Sandeep | [e21353@eng.pdn.ac.lk](mailto:e21353@eng.pdn.ac.lk) |

**Supervisors:** Ms. Yashodha Vimukthi, Thiliru Samaradiwakara

---

## Links

| Resource | Link |
| --- | --- |
| GitHub Repository | [Project Repository](https://github.com/cepdnaclk/e21-3yp-Mountain-Climber-Health-and-GPS-Tracker){:target="_blank"} |
| GitHub Pages Site | [Project Page](https://cepdnaclk.github.io/e21-3yp-Mountain-Climber-Health-and-GPS-Tracker){:target="_blank"} |
| Department of Computer Engineering | [Department Website](http://www.ce.pdn.ac.lk/){:target="_blank"} |
| University of Peradeniya | [Faculty of Engineering](https://eng.pdn.ac.lk/){:target="_blank"} |

---

## Academic Context

This project is developed as part of the undergraduate third-year engineering project at the **Department of Computer Engineering, Faculty of Engineering, University of Peradeniya**.

---

## Future Roadmap

- [ ] LoRa packet encryption (AES-128) for secure communication
- [ ] Custom PCB with impedance-matched RF traces for optimized range
- [ ] IP67-rated weather-resistant enclosure for field deployment
- [ ] Low-temperature batteries (LiSOCl₂) for extreme alpine conditions
- [ ] Solar-powered repeater nodes for permanent trail coverage
- [ ] Accelerometer-based automatic fall and avalanche detection
- [ ] Cloud data sync when basecamp has Starlink/cellular connectivity
- [ ] FCC/CE RF certification for commercial deployment

---

<p align="center">
  <strong>Mountain Climber IoT Safety Tracking System</strong><br>
  Department of Computer Engineering<br>
  Faculty of Engineering, University of Peradeniya
</p>

</div> <!-- End of wrapper -->
---
layout: null
permalink: index.html
---
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mountain Climber IoT Safety Tracking System</title>
  
  <!-- Custom CSS -->
  <link rel="stylesheet" href="./assets/css/summit-glass.css">
  
  <!-- Phosphor Icons -->
  <script src="https://unpkg.com/@phosphor-icons/web"></script>
</head>
<body>

  <!-- HERO SECTION -->
  <header class="hero">
    <h1 class="gradient-text">Summit Tracker</h1>
    <p>An off-grid IoT-based safety tracking, health monitoring, and emergency communication system for mountain climbers and basecamp rescue teams.</p>
    
    <div class="hero-badges">
      <img src="https://img.shields.io/badge/Status-Completed-brightgreen" alt="Project Status">
      <img src="https://img.shields.io/badge/Communication-LoRa%20433MHz-green" alt="LoRa Communication">
      <img src="https://img.shields.io/badge/Range-15km+-orange" alt="Range">
    </div>

    <div class="btn-group">
      <a href="https://youtu.be/YOUR_VIDEO_ID" target="_blank" class="btn btn-primary">
        <i class="ph ph-play-circle"></i> Watch Demo
      </a>
      <a href="https://summit-gear-portal.vercel.app" target="_blank" class="btn btn-secondary">
        <i class="ph ph-shopping-cart"></i> Commercial Portal
      </a>
    </div>
  </header>

  <!-- ARCHITECTURE DIAGRAM -->
  <section class="section">
    <div class="container">
      <h2 class="section-title"><span class="gradient-text">System Architecture</span></h2>
      <p class="section-desc">How data flows from the climber's wrist to the basecamp dashboard entirely off-grid.</p>
      
      <div class="arch-diagram">
        <h3 style="color: var(--teal); margin-bottom: 20px;">
          <i class="ph ph-watch"></i> Wristband (BLE) → <i class="ph ph-device-mobile"></i> Mobile App (WiFi) → <i class="ph ph-cpu"></i> Climber ESP32 (LoRa) → <i class="ph ph-broadcast"></i> Repeater (LoRa) → <i class="ph ph-desktop"></i> Basecamp Dashboard
        </h3>
        <p style="color: var(--text-muted);">The system relies on a 433MHz LoRa mesh network for 15km+ range, entirely bypassing expensive satellite networks or unavailable cellular coverage.</p>
      </div>
    </div>
  </section>

  <!-- FEATURES -->
  <section class="section">
    <div class="container">
      <h2 class="section-title"><span class="gradient-text">Core Features</span></h2>
      <p class="section-desc">Engineered for extreme environments with zero subscription costs.</p>
      
      <div class="grid-3">
        <div class="glass-card">
          <h3><i class="ph ph-crosshair" style="color: var(--teal)"></i> Smart GPS Filtering</h3>
          <p>Rejects GPS jitter, teleport jumps, and low-satellite anomalies. If hardware GPS fails, the mobile phone's GPS acts as an automatic fallback.</p>
        </div>
        <div class="glass-card">
          <h3><i class="ph ph-warning" style="color: var(--coral)"></i> Accelerated SOS</h3>
          <p>When the physical panic button is pressed, telemetry jumps to 1-second intervals with maximum transmission priority and LBT retry logic.</p>
        </div>
        <div class="glass-card">
          <h3><i class="ph ph-heartbeat" style="color: var(--teal)"></i> Vitals Monitoring</h3>
          <p>Continuous heart rate and sensor-attachment monitoring via a custom ESP32-H2 BLE wearable, relayed to basecamp.</p>
        </div>
        <div class="glass-card">
          <h3><i class="ph ph-chat-text" style="color: var(--coral)"></i> Two-Way Messaging</h3>
          <p>Send and receive critical text messages between basecamp and the mobile app via the LoRa hardware bridge.</p>
        </div>
        <div class="glass-card">
          <h3><i class="ph ph-network" style="color: var(--teal)"></i> Mesh Networking</h3>
          <p>Autonomous repeater nodes extend signal over mountain ridges using smart TTL-limited multi-hop routing.</p>
        </div>
        <div class="glass-card">
          <h3><i class="ph ph-shield-check" style="color: var(--coral)"></i> Commercial Backend</h3>
          <p>Full e-commerce portal (Next.js & Supabase) for device purchasing, registration, and secure OTA firmware distribution.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- HARDWARE COMPONENTS -->
  <section class="section">
    <div class="container">
      <h2 class="section-title"><span class="gradient-text">Hardware Stack</span></h2>
      
      <div class="grid-2">
        <div class="glass-card">
          <img src="images/climber-node.png" alt="Climber Node" class="hardware-img" onerror="this.src='https://via.placeholder.com/400x200/1e293b/38bdf8?text=Climber+Node'">
          <h3>Climber Main Device</h3>
          <p>ESP32 + SX1278 LoRa + NEO-6M GPS. Worn on the backpack, acts as the central hub.</p>
        </div>
        <div class="glass-card">
          <img src="images/ble-watch.png" alt="Armband" class="hardware-img" onerror="this.src='https://via.placeholder.com/400x200/1e293b/38bdf8?text=BLE+Wristband'">
          <h3>Health Wristband</h3>
          <p>ESP32-H2 + MAX30102. Relays heart rate over BLE to the mobile app.</p>
        </div>
        <div class="glass-card">
          <img src="images/repeater-node.png" alt="Repeater" class="hardware-img" onerror="this.src='https://via.placeholder.com/400x200/1e293b/38bdf8?text=LoRa+Repeater'">
          <h3>LoRa Repeater</h3>
          <p>Autonomous mesh node that re-transmits packets to extend range over ridges.</p>
        </div>
        <div class="glass-card">
          <img src="images/basecamp-node.png" alt="Basecamp" class="hardware-img" onerror="this.src='https://via.placeholder.com/400x200/1e293b/38bdf8?text=Basecamp+Node'">
          <h3>Basecamp Receiver</h3>
          <p>USB-serial bridge linking the LoRa network directly to the rescue coordinator's laptop.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- SCREENSHOTS -->
  <section class="section">
    <div class="container">
      <h2 class="section-title"><span class="gradient-text">Software Suite</span></h2>
      <p class="section-desc">Fully integrated from the mountain to the cloud.</p>
      
      <h3 style="color: var(--teal); margin-bottom: 10px;">Basecamp Dashboard (Flask + Leaflet)</h3>
      <div class="screenshot-container">
        <img src="images/dashboard.png" alt="Dashboard Screenshot" class="screenshot-img" onerror="this.src='https://via.placeholder.com/900x500/1e293b/38bdf8?text=Upload+dashboard.png+to+docs/images'">
      </div>

      <h3 style="color: var(--coral); margin-bottom: 10px;">Climber Mobile App (Flutter)</h3>
      <div class="screenshot-container" style="max-width: 400px; margin: 0 auto 40px auto;">
        <img src="images/mobile-app.png" alt="Mobile App Screenshot" class="screenshot-img" onerror="this.src='https://via.placeholder.com/400x800/1e293b/38bdf8?text=Upload+mobile-app.png+to+docs/images'">
      </div>

      <h3 style="color: var(--teal); margin-bottom: 10px;">Summit Gear Portal (Next.js + Supabase)</h3>
      <div class="screenshot-container">
        <img src="images/portal.png" alt="Portal Screenshot" class="screenshot-img" onerror="this.src='https://via.placeholder.com/900x500/1e293b/38bdf8?text=Upload+portal.png+to+docs/images'">
      </div>
    </div>
  </section>

  <!-- TEAM & SUPERVISION -->
  <section class="section" style="border-bottom: none;">
    <div class="container">
      <h2 class="section-title"><span class="gradient-text">The Team</span></h2>
      <p class="section-desc">Group 23 • CO328 / 3YP • Dept. of Computer Engineering, UoP</p>
      
      <div class="grid-3" style="gap: 50px;">
        <div class="team-member">
          <div class="team-avatar">👨‍💻</div>
          <h3 class="team-name">Sahan Jayasundara</h3>
          <p class="team-role">E/21/198</p>
          <div class="team-links">
            <a href="https://github.com/#"><i class="ph ph-github-logo"></i></a>
            <a href="https://linkedin.com/in/#"><i class="ph ph-linkedin-logo"></i></a>
          </div>
        </div>
        <div class="team-member">
          <div class="team-avatar">👨‍💻</div>
          <h3 class="team-name">Prabash Rathnayaka</h3>
          <p class="team-role">E/21/328</p>
          <div class="team-links">
            <a href="https://github.com/prabashmalhara"><i class="ph ph-github-logo"></i></a>
            <a href="https://linkedin.com/in/#"><i class="ph ph-linkedin-logo"></i></a>
          </div>
        </div>
        <div class="team-member">
          <div class="team-avatar">👨‍💻</div>
          <h3 class="team-name">Pasan Sandeep</h3>
          <p class="team-role">E/21/353</p>
          <div class="team-links">
            <a href="https://github.com/#"><i class="ph ph-github-logo"></i></a>
            <a href="https://linkedin.com/in/#"><i class="ph ph-linkedin-logo"></i></a>
          </div>
        </div>
      </div>

      <div class="supervisors">
        <h3 style="color: var(--teal); margin-bottom: 10px;">Academic Supervision</h3>
        <p style="color: var(--text-muted); font-size: 1.1rem;">
          Ms. Yashodha Vimukthi<br>
          Mr. Thiliru Samaradiwakara
        </p>
      </div>
    </div>
  </section>

</body>
</html>
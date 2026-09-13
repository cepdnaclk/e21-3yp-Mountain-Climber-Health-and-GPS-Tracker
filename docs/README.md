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
  
  <!-- Custom CSS (Portal Theme) -->
  <link rel="stylesheet" href="./assets/css/summit-glass.css">
  
  <!-- Phosphor Icons -->
  <script src="https://unpkg.com/@phosphor-icons/web"></script>
</head>
<body>

  <!-- HERO SECTION -->
  <header class="hero">
    <h1>Summit Tracker</h1>
    <p>An off-grid IoT-based safety tracking, health monitoring, and emergency communication system for mountain climbers and basecamp rescue teams.</p>
    
    <div class="btn-group">
      <a href="https://youtu.be/YOUR_VIDEO_ID" target="_blank" class="btn btn-primary">
        <i class="ph ph-play-circle"></i> Watch Demo
      </a>
      <a href="https://summit-gear-portal.vercel.app" target="_blank" class="btn btn-secondary">
        <i class="ph ph-shopping-cart"></i> View Portal
      </a>
    </div>
  </header>

  <!-- ARCHITECTURE DIAGRAM -->
  <section class="section" style="background: var(--bg-secondary);">
    <div class="container">
      <h2 class="section-title">System Architecture</h2>
      <p class="section-desc">How data flows from the climber's wrist to the basecamp dashboard entirely off-grid.</p>
      
      <div class="card" style="text-align: center;">
        <h3 style="color: var(--accent); margin-bottom: 20px; justify-content: center;">
          <i class="ph ph-watch"></i> Wristband (BLE) &rarr; 
          <i class="ph ph-device-mobile"></i> Mobile App (WiFi) &rarr; 
          <i class="ph ph-cpu"></i> Climber ESP32 (LoRa) &rarr; 
          <i class="ph ph-broadcast"></i> Repeater (LoRa) &rarr; 
          <i class="ph ph-desktop"></i> Basecamp Dashboard
        </h3>
        <p style="color: var(--text-secondary);">The system relies on a 433MHz LoRa mesh network for 15km+ range, entirely bypassing expensive satellite networks or unavailable cellular coverage.</p>
      </div>
    </div>
  </section>

  <!-- HARDWARE COMPONENTS -->
  <section class="section">
    <div class="container">
      <h2 class="section-title">Physical Products</h2>
      <p class="section-desc">Hardware designed for extreme alpine environments.</p>
      
      <div class="grid-2">
        <div class="card">
          <!-- Placeholder for Climber Node Image -->
          <div class="placeholder-img">
            Drop your real Climber Node image here<br>
            (docs/images/climber-node.png)
          </div>
          <h3>Climber Main Device</h3>
          <p>ESP32 + SX1278 LoRa + NEO-6M GPS. Worn on the backpack, acts as the central hub.</p>
        </div>
        <div class="card">
          <!-- Placeholder for Wristband Image -->
          <div class="placeholder-img">
            Drop your real Health Wristband image here<br>
            (docs/images/ble-watch.png)
          </div>
          <h3>Health Wristband</h3>
          <p>ESP32-H2 + MAX30102. Relays heart rate over BLE to the mobile app.</p>
        </div>
        <div class="card">
          <!-- Placeholder for Repeater Image -->
          <div class="placeholder-img">
            Drop your real LoRa Repeater image here<br>
            (docs/images/repeater-node.png)
          </div>
          <h3>LoRa Repeater</h3>
          <p>Autonomous mesh node that re-transmits packets to extend range over ridges.</p>
        </div>
        <div class="card">
          <!-- Placeholder for Basecamp Image -->
          <div class="placeholder-img">
            Drop your real Basecamp Receiver image here<br>
            (docs/images/basecamp-node.png)
          </div>
          <h3>Basecamp Receiver</h3>
          <p>USB-serial bridge linking the LoRa network directly to the rescue coordinator's laptop.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- SOFTWARE SCREENSHOTS -->
  <section class="section" style="background: var(--bg-secondary);">
    <div class="container">
      <h2 class="section-title">Software Suite</h2>
      <p class="section-desc">Fully integrated from the mountain to the cloud.</p>
      
      <h3 class="text-accent" style="margin-bottom: 10px;">Basecamp Dashboard (Flask + Leaflet)</h3>
      <div class="screenshot-container">
        <!-- Placeholder for Dashboard Image -->
        <div class="placeholder-img">
            Drop your Dashboard screenshot here<br>
            (docs/images/dashboard.png)
        </div>
      </div>

      <h3 class="text-accent" style="margin-bottom: 10px;">Climber Mobile App (Flutter)</h3>
      <div class="screenshot-container" style="max-width: 400px; margin: 0 auto 40px auto;">
        <!-- Placeholder for Mobile App Image -->
        <div class="placeholder-img">
            Drop your Mobile App screenshot here<br>
            (docs/images/mobile-app.png)
        </div>
      </div>

      <h3 class="text-accent" style="margin-bottom: 10px;">Summit Gear Portal (Next.js + Supabase)</h3>
      <div class="screenshot-container">
        <!-- Placeholder for Portal Image -->
        <div class="placeholder-img">
            Drop your Summit Portal screenshot here<br>
            (docs/images/portal.png)
        </div>
      </div>
    </div>
  </section>

  <!-- TEAM & SUPERVISION -->
  <section class="section">
    <div class="container">
      <h2 class="section-title">The Team</h2>
      <p class="section-desc">Group 23 • CO328 / 3YP • Dept. of Computer Engineering, UoP</p>
      
      <div class="grid-3">
        <div class="card team-member">
          <h3 style="justify-content: center;">Sahan Jayasundara</h3>
          <p class="team-role">E/21/198</p>
        </div>
        <div class="card team-member">
          <h3 style="justify-content: center;">Prabash Rathnayaka</h3>
          <p class="team-role">E/21/328</p>
        </div>
        <div class="card team-member">
          <h3 style="justify-content: center;">Pasan Sandeep</h3>
          <p class="team-role">E/21/353</p>
        </div>
      </div>

      <div class="supervisors">
        <h3 class="text-accent" style="justify-content: center; margin-bottom: 15px; font-size: 1.5rem;">Academic Supervision</h3>
        <p style="color: var(--text-primary); font-size: 1.15rem; font-weight: 500; margin-bottom: 5px;">
          Ms. Yashodha Vimukthi
        </p>
        <p style="color: var(--text-primary); font-size: 1.15rem; font-weight: 500;">
          Mr. Thiliru Samaradiwakara
        </p>
        <p style="color: var(--text-secondary); margin-top: 15px;">
          Department of Computer Engineering<br>
          Faculty of Engineering, University of Peradeniya
        </p>
      </div>
    </div>
  </section>

</body>
</html>
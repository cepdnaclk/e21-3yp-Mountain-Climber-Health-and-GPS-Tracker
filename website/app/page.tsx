import Link from "next/link";
import Image from "next/image";

const features = [
  {
    image: "/climber-node.png",
    title: "Climber Node",
    badge: "Wearable Sensor",
    description:
      "Lightweight, ruggedized wrist-worn sensor node designed for extreme cold. Features a high-visibility OLED display, multi-pin diagnostic header, and direct LoRa 433MHz comms.",
  },
  {
    image: "/basecamp-node.png",
    title: "Basecamp Node",
    badge: "Command Hub",
    description:
      "The central command hub for your entire expedition. Aggregates data from up to 50 active nodes, features a high-gain antenna, LED status bar, and one-touch emergency SOS broadcast.",
  },
  {
    image: "/repeater-node.png",
    title: "Repeater Node",
    badge: "Mesh Relay",
    description:
      "Extends your mesh network deep into terrain where direct radio contact is impossible. Long-life battery, plug-and-play setup.",
  },
  {
    image: "/ble-watch.png",
    title: "BLE-Watch",
    badge: "Biometric Hub",
    description:
      "Rugged biometric wrist hub that connects to the Climber Node via Bluetooth. Tracks health metrics and allows quick interaction without reaching for the primary node.",
  },
];

const steps = [
  {
    step: "01",
    title: "Order Your Hardware",
    description:
      "Browse our catalog and request the sensor nodes that fit your expedition profile.",
  },
  {
    step: "02",
    title: "Register Your Device",
    description:
      "Enter your device's unique serial number to link it to your account after it arrives.",
  },
  {
    step: "03",
    title: "Download & Deploy",
    description:
      "Once approved, access the latest firmware for your specific hardware and get in the field.",
  },
];

const stats = [
  { value: "3", label: "Hardware Platforms" },
  { value: "-40°C", label: "Operating Temperature" },
  { value: "15km", label: "Mesh Range" },
  { value: "99.9%", label: "Uptime SLA" },
];

export default function HomePage() {
  return (
    <div className="home-page">
      {/* ── HERO ───────────────────────────────────────────────── */}
      <section className="hero-section">
        <div className="hero-glow hero-glow-left" />
        <div className="hero-glow hero-glow-right" />
        <div className="hero-content">
          <div className="hero-badge">
            <span className="hero-badge-dot" />
            Portal v1.0 — Now Live
          </div>

          <h1 className="hero-title">
            Precision Gear for
            <br />
            <span className="hero-title-accent">Extreme Environments</span>
          </h1>

          <p className="hero-subtitle">
            Summit Gear designs ruggedized IoT hardware for mountaineering,
            search &amp; rescue, and scientific field operations. Manage your
            devices, track orders, and access firmware — all in one place.
          </p>

          <div className="hero-actions">
            <Link href="/products" className="btn-primary">
              Explore Products
              <svg
                className="btn-icon"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </Link>
            <Link href="/login" className="btn-secondary">
              Customer Portal
            </Link>
          </div>

          {/* Stats strip */}
          <div className="hero-stats">
            {stats.map((s) => (
              <div key={s.label} className="hero-stat">
                <span className="hero-stat-value">{s.value}</span>
                <span className="hero-stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Decorative grid */}
        <div className="hero-grid-overlay" aria-hidden="true" />
      </section>

      {/* ── FEATURES ───────────────────────────────────────────── */}
      <section className="section features-section">
        <div className="section-container">
          <div className="section-header">
            <span className="section-label">Hardware Lineup</span>
            <h2 className="section-title">Built for the Mountain</h2>
            <p className="section-subtitle">
              Every node is field-tested at altitude before it ever reaches a
              customer. No compromises.
            </p>
          </div>

          <div className="features-grid">
            {features.map((f) => (
              <div key={f.title} className="feature-card">
                <div className="feature-img-wrap">
                  <Image
                    src={f.image}
                    alt={f.title}
                    width={400}
                    height={280}
                    className="feature-img"
                  />
                  <span className="feature-badge">{f.badge}</span>
                </div>
                <div className="feature-body">
                  <h3 className="feature-title">{f.title}</h3>
                  <p className="feature-desc">{f.description}</p>
                  <Link href="/products" className="feature-link">
                    View specs →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────────────── */}
      <section className="section how-section">
        <div className="section-container">
          <div className="section-header">
            <span className="section-label">Portal Workflow</span>
            <h2 className="section-title">From Order to Field</h2>
            <p className="section-subtitle">
              The Summit Gear portal handles everything from purchase to firmware
              deployment in three simple steps.
            </p>
          </div>

          <div className="steps-grid">
            {steps.map((s, i) => (
              <div key={s.step} className="step-card">
                <div className="step-connector">
                  {i < steps.length - 1 && (
                    <div className="step-line" aria-hidden="true" />
                  )}
                </div>
                <div className="step-number">{s.step}</div>
                <h3 className="step-title">{s.title}</h3>
                <p className="step-desc">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ─────────────────────────────────────────── */}
      <section className="section cta-section">
        <div className="section-container">
          <div className="cta-card">
            <div className="cta-glow" aria-hidden="true" />
            <h2 className="cta-title">Ready to Equip Your Team?</h2>
            <p className="cta-subtitle">
              Create an account, browse the hardware catalog, and place your
              first order in minutes.
            </p>
            <div className="cta-actions">
              <Link href="/signup" className="btn-primary">
                Create Account
              </Link>
              <Link href="/products" className="btn-ghost">
                View Catalog
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────── */}
      <footer className="site-footer">
        <div className="section-container footer-inner">
          <div className="footer-brand">
            <Image src="/logo.png" alt="Summit Gear" width={130} height={44} style={{ objectFit: 'contain', width: 'auto', height: '44px' }} />
            <p className="footer-tagline">
              Precision IoT hardware for extreme environments.
            </p>
          </div>
          <div className="footer-links">
            <Link href="/products" className="footer-link">Products</Link>
            <Link href="/login" className="footer-link">Customer Portal</Link>
          </div>
          <p className="footer-copy">
            © {new Date().getFullYear()} Summit Gear. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

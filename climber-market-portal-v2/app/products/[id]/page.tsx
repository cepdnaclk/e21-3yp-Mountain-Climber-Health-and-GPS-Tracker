import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import AddToCartButton from "./add-to-cart-button";

// Dynamic route: [id] in the folder name means this page receives
// a `params` object with whatever value is in the URL.
// /products/abc123 → params.id = "abc123"

type Product = {
  id: string;
  name: string;
  description: string;
  category: "hardware" | "software";
  price: number;
  stock_count: number;
  image_url: string;
  is_active: boolean;
};

const productIcons: Record<string, string> = {
  "Climber App": "📱",
  "Dashboard Software": "🖥️",
};

const productImages: Record<string, string> = {
  "Climber Node": "/climber-node.png",
  "Basecamp Node": "/basecamp-node.png",
  "Repeater Node": "/repeater-node.png",
  "BLE-Watch": "/ble-watch.png",
};

// Specs for each product — in a real app these would come from the DB
const productSpecs: Record<string, { label: string; value: string }[]> = {
  "Climber Node": [
    { label: "Frequency", value: "868 / 915 MHz LoRa" },
    { label: "Range", value: "Up to 10 km line-of-sight" },
    { label: "Battery", value: "72 hours (3000 mAh)" },
    { label: "GPS", value: "u-blox M10 GNSS" },
    { label: "Rating", value: "IP67 Waterproof" },
    { label: "Weight", value: "85g" },
  ],
  "Basecamp Node": [
    { label: "Frequency", value: "868 / 915 MHz LoRa" },
    { label: "Range", value: "Up to 15 km" },
    { label: "Max Nodes", value: "50 simultaneous" },
    { label: "Power", value: "USB-C / Solar panel" },
    { label: "Connectivity", value: "Wi-Fi + LoRa gateway" },
    { label: "Storage", value: "32 GB local logging" },
  ],
  "Repeater Node": [
    { label: "Frequency", value: "868 / 915 MHz LoRa" },
    { label: "Range Extension", value: "+8 km per hop" },
    { label: "Battery", value: "7 days (solar-assisted)" },
    { label: "Rating", value: "IP68 Weatherproof" },
    { label: "Mounting", value: "Pole / tree strap included" },
    { label: "Weight", value: "320g" },
  ],
  "Climber App": [
    { label: "Platforms", value: "iOS 15+ / Android 12+" },
    { label: "Connectivity", value: "Bluetooth LE to Node" },
    { label: "Features", value: "Real-time GPS, SOS, Chat" },
    { label: "Offline", value: "Full offline map support" },
  ],
  "Dashboard Software": [
    { label: "Framework", value: "Flutter (cross-platform)" },
    { label: "Platforms", value: "Windows, macOS, Linux" },
    { label: "Features", value: "Topo maps, alerts, logs" },
    { label: "Export", value: "GPX, CSV, PDF reports" },
  ],
};

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch the single product by its UUID
  const { data: product, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .eq("is_active", true)
    .single();

  let p: Product;

  // Temporarily handle the mocked BLE-Watch if it hasn't been added to DB
  if (id === "ble-watch-temp-id") {
    p = {
      id: "ble-watch-temp-id",
      name: "BLE-Watch",
      description: "Rugged biometric wrist hub that connects to the Climber Node via Bluetooth. Tracks health metrics, displays alerts, and allows quick interaction without reaching for the primary node.",
      category: "hardware",
      price: 129.99,
      stock_count: 40,
      image_url: "",
      is_active: true,
    };
  } else if (error || !product) {
    // If not found in DB and not our temporary mock, show Next.js 404 page
    notFound();
  } else {
    p = product as Product;
  }
  const icon = productIcons[p.name] || "📦";
  const image = productImages[p.name];
  const specs = productSpecs[p.name] || [];
  const inStock = p.stock_count > 0;

  return (
    <div className="detail-container">
      {/* Back link */}
      <Link href="/products" className="detail-back">
        ← Back to Catalog
      </Link>

      <div className="detail-layout">
        {/* Left: Product visual */}
        <div className={`detail-hero-visual ${image ? '' : p.category}`}>
          {image ? (
            <Image src={image} alt={p.name} width={500} height={400} className="detail-hero-image" />
          ) : (
            <>
              <span className="detail-hero-icon">{icon}</span>
              <span className="detail-hero-category">{p.category}</span>
            </>
          )}
        </div>

        {/* Right: Product info */}
        <div className="detail-info">
          <h1 className="detail-name">{p.name}</h1>
          <p className="detail-description">{p.description}</p>

          <div className="detail-price-row">
            <span className="detail-price">${p.price.toFixed(2)}</span>
            <span className={`detail-stock ${inStock ? "in-stock" : "out-of-stock"}`}>
              {inStock ? `${p.stock_count} in stock` : "Out of stock"}
            </span>
          </div>

          {/* Specs table */}
          {specs.length > 0 && (
            <div className="detail-specs">
              <h2 className="detail-specs-title">Specifications</h2>
              <table className="specs-table">
                <tbody>
                  {specs.map((spec) => (
                    <tr key={spec.label}>
                      <td className="spec-label">{spec.label}</td>
                      <td className="spec-value">{spec.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <AddToCartButton product={p} />
        </div>
      </div>
    </div>
  );
}

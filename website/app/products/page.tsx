import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Image from "next/image";
// then sends ready-made HTML to the browser. Fast and SEO-friendly.
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
const categoryIcons: Record<string, string> = {
  hardware: "📡",
  software: "💻",
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

export default async function ProductsPage() {
  const supabase = await createClient();

  // Fetch all active products, ordered by category then name.
  // .eq("is_active", true) filters out products the admin has hidden.
  const { data: products, error } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("category", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    return (
      <div className="catalog-container">
        <p className="catalog-error">Failed to load products: {error.message}</p>
      </div>
    );
  }

  // Split products into hardware and software for section display
  const hardware = products?.filter((p: Product) => p.category === "hardware") ?? [];
  const software = products?.filter((p: Product) => p.category === "software") ?? [];

  // Temporarily inject BLE-Watch if it hasn't been added to the database yet
  if (!hardware.some(p => p.name === "BLE-Watch")) {
    hardware.push({
      id: "ble-watch-temp-id",
      name: "BLE-Watch",
      description: "Rugged biometric wrist hub that connects to the Climber Node via Bluetooth. Tracks health metrics, displays alerts, and allows quick interaction without reaching for the primary node.",
      category: "hardware",
      price: 129.99,
      stock_count: 40,
      image_url: "",
      is_active: true,
    });
  }

  return (
    <div className="catalog-container">
      <div className="catalog-header">
        <h1 className="catalog-title">Product Catalog</h1>
        <p className="catalog-subtitle">
          Everything you need for off-grid mountain safety tracking
        </p>
      </div>

      {/* Hardware Section */}
      {hardware.length > 0 && (
        <section className="catalog-section">
          <h2 className="section-title">
            <span className="section-icon">📡</span> Hardware Nodes
          </h2>
          <div className="product-grid">
            {hardware.map((product: Product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* Software Section */}
      {software.length > 0 && (
        <section className="catalog-section">
          <h2 className="section-title">
            <span className="section-icon">💻</span> Software & Apps
          </h2>
          <div className="product-grid">
            {software.map((product: Product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {products?.length === 0 && (
        <p className="catalog-empty">No products available yet. Check back soon!</p>
      )}
    </div>
  );
}

// A reusable card component for displaying one product
function ProductCard({ product }: { product: Product }) {
  const icon = productIcons[product.name] || categoryIcons[product.category] || "📦";
  const image = productImages[product.name];
  const inStock = product.stock_count > 0;

  return (
    <Link href={`/products/${product.id}`} className="product-card">
      <div className={`product-card-visual ${image ? '' : product.category}`}>
        {image ? (
          <Image src={image} alt={product.name} width={300} height={200} className="product-card-image" />
        ) : (
          <span>{icon}</span>
        )}
      </div>
      <div className="product-card-body">
        <div className="product-card-category">{product.category}</div>
        <h3 className="product-card-name">{product.name}</h3>
        <p className="product-card-desc">
          {product.description.length > 100
            ? product.description.substring(0, 100) + "..."
            : product.description}
        </p>
        <div className="product-card-footer">
          <span className="product-card-price">
            ${product.price.toFixed(2)}
          </span>
          <span className={`product-card-stock ${inStock ? "in-stock" : "out-of-stock"}`}>
            {inStock ? `${product.stock_count} in stock` : "Out of stock"}
          </span>
        </div>
      </div>
    </Link>
  );
}

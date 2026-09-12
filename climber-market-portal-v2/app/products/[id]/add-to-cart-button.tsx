"use client";

import { useCart } from "@/app/cart-context";
import { useState } from "react";
// and update the React Context (Cart State).

type Props = {
  product: {
    id: string;
    name: string;
    price: number;
    stock_count: number;
  };
};

export default function AddToCartButton({ product }: Props) {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);

  const inStock = product.stock_count > 0;

  const handleAdd = () => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
    });
    
    // Show temporary "Added!" feedback
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <>
      <button
        onClick={handleAdd}
        className="detail-order-btn"
        disabled={!inStock}
      >
        {added ? "✅ Added to Cart" : inStock ? "Add to Order" : "Out of Stock"}
      </button>
      {!inStock && (
        <p className="detail-stock-note">
          This product is currently unavailable. Please check back later.
        </p>
      )}
    </>
  );
}

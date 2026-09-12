"use client";

import { useCart } from "@/app/cart-context";
import { placeOrder } from "@/app/actions/order";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CartPage() {
  const { items, removeFromCart, clearCart, totalPrice } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleCheckout = async () => {
    setLoading(true);
    setError(null);

    const result = await placeOrder(items);

    if (result.success) {
      setSuccess(true);
      clearCart();
    } else {
      setError(result.error || "Something went wrong.");
      if (result.error === "You must be logged in to place an order.") {
        // Redirect to login if not authenticated
        setTimeout(() => router.push("/login"), 2000);
      }
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="cart-container">
        <div className="cart-card success-card">
          <h1 className="cart-title text-success">🎉 Order Placed!</h1>
          <p className="cart-subtitle">
            Your order has been requested. An admin will review it shortly.
          </p>
          <Link href="/products" className="cart-continue-btn">
            Continue Browsing
          </Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="cart-container">
        <div className="cart-card empty-card">
          <h1 className="cart-title">Your Cart is Empty</h1>
          <p className="cart-subtitle">Looks like you haven't added anything yet.</p>
          <Link href="/products" className="cart-continue-btn">
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-container">
      <h1 className="cart-title">Your Order</h1>
      <div className="cart-layout">
        
        {/* Left side: Items */}
        <div className="cart-items">
          {items.map((item) => (
            <div key={item.id} className="cart-item">
              <div className="cart-item-info">
                <h3 className="cart-item-name">{item.name}</h3>
                <p className="cart-item-price">${item.price.toFixed(2)} x {item.quantity}</p>
              </div>
              <div className="cart-item-actions">
                <span className="cart-item-subtotal">
                  ${(item.price * item.quantity).toFixed(2)}
                </span>
                <button 
                  onClick={() => removeFromCart(item.id)}
                  className="cart-remove-btn"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Right side: Summary */}
        <div className="cart-summary">
          <h2 className="summary-title">Summary</h2>
          <div className="summary-row">
            <span>Subtotal</span>
            <span>${totalPrice.toFixed(2)}</span>
          </div>
          <div className="summary-row">
            <span>Shipping</span>
            <span>Calculated later</span>
          </div>
          <div className="summary-total">
            <span>Total</span>
            <span>${totalPrice.toFixed(2)}</span>
          </div>

          {error && <div className="cart-error">{error}</div>}

          <button 
            className="cart-checkout-btn"
            onClick={handleCheckout}
            disabled={loading}
          >
            {loading ? "Processing..." : "Request Order"}
          </button>
        </div>
      </div>
    </div>
  );
}

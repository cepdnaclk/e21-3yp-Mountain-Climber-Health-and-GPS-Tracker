"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Processes e-commerce transactions and creates associated order records.
 * 
 * @module OrderActions
 */


export async function placeOrder(items: { id: string; quantity: number; price: number }[]) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "You must be logged in to place an order." };
  }

  if (!items || items.length === 0) {
    return { success: false, error: "Cart is empty." };
  }

  // Fetch actual prices from database
  const productIds = items.map(i => i.id);
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id, price")
    .in("id", productIds);

  if (productsError || !products) {
    return { success: false, error: "Failed to fetch product prices." };
  }

  const priceMap = new Map(products.map(p => [p.id, p.price]));

  // Calculate total amount
  const totalAmount = items.reduce((sum, item) => {
    const dbPrice = priceMap.get(item.id) || 0;
    return sum + dbPrice * item.quantity;
  }, 0);
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      user_id: user.id,
      total_amount: totalAmount,
      status: "pending",
      shipping_address: "Address will be collected by admin", // Simplified for now
    })
    .select()
    .single();

  if (orderError) {
    console.error("Order insertion failed:", orderError);
    return { success: false, error: "Failed to create order." };
  }
  const orderItemsData = items.map((item) => {
    const dbPrice = priceMap.get(item.id) || 0;
    return {
      order_id: order.id,
      product_id: item.id,
      quantity: item.quantity,
      unit_price: dbPrice,
    };
  });

  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(orderItemsData);

  if (itemsError) {
    console.error("Order items insertion failed:", itemsError);
    await supabase.from("orders").delete().eq("id", order.id);
    return { success: false, error: "Failed to add items to order." };
  }

  // Tell Next.js to re-fetch any cached pages that might show orders
  revalidatePath("/orders");
  
  return { success: true, orderId: order.id };
}

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

  // Calculate total amount
  const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
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
  const orderItemsData = items.map((item) => ({
    order_id: order.id,
    product_id: item.id,
    quantity: item.quantity,
    unit_price: item.price,
  }));

  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(orderItemsData);

  if (itemsError) {
    console.error("Order items insertion failed:", itemsError);
    // Ideally we would rollback the order here in a real production app
    return { success: false, error: "Failed to add items to order." };
  }

  // Tell Next.js to re-fetch any cached pages that might show orders
  revalidatePath("/products");
  
  return { success: true, orderId: order.id };
}

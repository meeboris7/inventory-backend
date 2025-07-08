// app/api/inventory/create-order/route.ts

import { NextResponse } from 'next/server';
import { products, stock, suppliers, addPurchaseOrder, PurchaseOrder, Supplier } from '../../data'; 
import * as math from 'mathjs'; // For math.ceil, math.mean

// --- Interface for Request Body ---
interface CreateOrderRequest {
  product_id: string;
  quantity: number;
  optimization_goal?: 'cost' | 'speed' | 'reliability' | 'balance'; // Optional optimization goal
}

// --- Interface for Response Body (same as PurchaseOrder from data.ts) ---
// No need to redefine, just import PurchaseOrder if we want to explicitly use it for the return type.

export async function POST(request: Request) {
  try {
    const { product_id, quantity, optimization_goal = 'balance' }: CreateOrderRequest = await request.json();

    if (!product_id || !quantity || quantity <= 0) {
      return NextResponse.json(
        { error: 'Invalid request: product_id and a positive quantity are required.' },
        { status: 400 }
      );
    }

    const product = products.find(p => p.product_id === product_id);
    if (!product) {
      return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
    }

    // --- Intelligent Supplier Selection Logic ---
    const eligibleSuppliers = suppliers.filter(s => s.products_supplied.hasOwnProperty(product_id));

    if (eligibleSuppliers.length === 0) {
      return NextResponse.json(
        { error: `No suppliers found for product ${product_id}. Cannot place order.` },
        { status: 404 }
      );
    }

    let bestSupplier: Supplier | null = null;
    let highestScore = -1;

    for (const supplier of eligibleSuppliers) {
      const productDetail = supplier.products_supplied[product_id];
      if (!productDetail) continue; // Should not happen due to filter, but defensive check

      const price = productDetail.price;
      const moq = productDetail.moq;
      const leadTime = supplier.average_lead_time_days;
      const reliability = supplier.historical_on_time_delivery_rate;

      // Check if quantity meets MOQ
      if (quantity < moq) {
        console.warn(`Supplier ${supplier.name} for product ${product_id} has MOQ ${moq}, requested ${quantity}. Skipping.`);
        continue; // Skip supplier if MOQ is not met
      }

      let score = 0;

      // Scoring based on optimization goal
      switch (optimization_goal) {
        case 'cost':
          // Lower price = higher score
          score = 1000 / price; // Inverse relationship, higher value for lower price
          // Add minor reliability/speed boost
          score += reliability * 10;
          score += (100 - leadTime) / 10;
          break;
        case 'speed':
          // Lower lead time = higher score
          score = 1000 / leadTime; // Inverse relationship, higher value for lower lead time
          // Add minor cost/reliability boost
          score += reliability * 10;
          score += (1000 / price) / 100;
          break;
        case 'reliability':
          // Higher reliability = higher score
          score = reliability * 1000;
          // Add minor cost/speed boost
          score += (1000 / price) / 100;
          score += (100 - leadTime) / 10;
          break;
        case 'balance':
        default:
          // Balanced approach: consider all factors
          score = (reliability * 500) + // Max 500
                  (1000 / price) +      // Inverse price, e.g., for price 100 -> 10, for 10 -> 100
                  (100 / leadTime);     // Inverse lead time, e.g., for 5 days -> 20, for 10 days -> 10
          break;
      }

      if (score > highestScore) {
        highestScore = score;
        bestSupplier = supplier;
      }
    }

    if (!bestSupplier) {
        return NextResponse.json(
            { error: `No suitable supplier found for product ${product_id} with requested quantity (${quantity}) meeting MOQs.` },
            { status: 404 }
        );
    }

    // --- Simulate Order Creation ---
    const orderDate = new Date();
    const expectedDeliveryDate = new Date(orderDate);
    expectedDeliveryDate.setDate(orderDate.getDate() + bestSupplier.average_lead_time_days);

    const newOrder: Omit<PurchaseOrder, 'po_id' | 'order_date'> = {
      supplier_id: bestSupplier.supplier_id,
      product_id: product_id,
      quantity_ordered: quantity,
      expected_delivery_date: expectedDeliveryDate.toISOString(),
      actual_delivery_date: null,
      status: 'pending'
    };

    const createdPO = addPurchaseOrder(newOrder); // This pushes to our in-memory array

    // Simulate stock reduction upon ordering (optional for demo, but realistic)
    // If you want to simulate stock reduction only upon *delivery*, skip this.
    // For simplicity, we can assume stock is reduced when an order is placed to reflect committed stock.
    // However, typically stock is reduced when sold, and new stock is added when received.
    // Let's NOT reduce stock here, as the agent's job is to suggest based on CURRENT stock.
    // The "delivery" process (Tool 3 or a separate process) would update stock.

    return NextResponse.json({
      ...createdPO,
      message: `Order placed for ${quantity} units of ${product.name} from ${bestSupplier.name}. Chosen for: ${optimization_goal} optimization.`,
      chosen_supplier_reason: `Best score (${highestScore}) based on ${optimization_goal}. Price: ${bestSupplier.products_supplied[product_id]?.price}, Lead Time: ${bestSupplier.average_lead_time_days} days, Reliability: ${bestSupplier.historical_on_time_delivery_rate * 100}%.`
    });

  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}

// You might also want a GET method for this route if you want to allow fetching all orders
// export async function GET() {
//   // ... logic to return all purchase orders (from data.ts)
//   return NextResponse.json(getAllPurchaseOrders());
// }
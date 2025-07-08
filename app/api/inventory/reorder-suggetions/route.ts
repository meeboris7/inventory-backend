// app/api/inventory/reorder-suggestions/route.ts

import { NextResponse } from 'next/server';
import { products, stock, suppliers, Supplier, Product, Stock } from '../../data'; // Adjust path based on your exact structure
import * as math from 'mathjs'; // For math.ceil, math.mean

// Interface for the response of this API route
export interface ProductReorderSuggestion {
  product_id: string;
  product_name: string;
  current_quantity_on_hand: number;
  average_daily_sales: number;
  avg_lead_time_days: number;
  safety_stock_percentage: number;
  calculated_reorder_point: number;
  suggested_order_quantity: number;
  reason: string;
}

export async function GET() {
  try {
    const suggestions: ProductReorderSuggestion[] = [];

    for (const product of products) {
      const stockInfo = stock.find(s => s.product_id === product.product_id);

      if (!stockInfo) {
        console.warn(`No stock info for product ${product.product_id}. Skipping.`);
        continue;
      }

      const quantityOnHand = stockInfo.quantity_on_hand;
      const averageDailySales = product.average_daily_sales_last_30_days;
      const safetyStockPercentage = product.safety_stock_percentage;

      // Find suppliers for this product to calculate average lead time
      const relevantSuppliers = suppliers.filter(supplier =>
        supplier.products_supplied.hasOwnProperty(product.product_id)
      );

      let avgLeadTimeDays = 0;
      if (relevantSuppliers.length > 0) {
        // Calculate average lead time from relevant suppliers
        const leadTimes = relevantSuppliers.map(s => s.average_lead_time_days);
        avgLeadTimeDays = math.ceil(math.mean(leadTimes));
      } else {
        console.warn(`No supplier found for product ${product.product_id}. Using default lead time of 7 days.`);
        avgLeadTimeDays = 7; // Default lead time if no supplier info
      }

      // Ensure lead time is at least 1 day for calculation
      const effectiveLeadTime = Math.max(1, avgLeadTimeDays);

      // --- AI Calculation: Dynamic Reorder Point ---
      // Formula: (Avg Daily Sales * Avg Lead Time) + (Avg Daily Sales * Safety Stock Percentage)
      const calculatedReorderPoint = Math.ceil(
        (averageDailySales * effectiveLeadTime) +
        (averageDailySales * safetyStockPercentage)
      );

      // Check against current stock
      if (quantityOnHand < calculatedReorderPoint) {
        let suggestedOrderQuantity = calculatedReorderPoint - quantityOnHand;

        // Ensure quantity is positive and meets a minimum (e.g., 1 or supplier MOQ if available)
        if (suggestedOrderQuantity <= 0) {
          suggestedOrderQuantity = 1;
        }

        // Get the minimum MOQ from any of the relevant suppliers for this product
        let minMoq = 1; // Default minimum order quantity
        if (relevantSuppliers.length > 0) {
            const productMoqs = relevantSuppliers
                .map(s => s.products_supplied[product.product_id]?.moq)
                .filter(moq => moq !== undefined);
            if (productMoqs.length > 0) {
                minMoq = Math.min(...productMoqs);
            }
        }
        // Ensure suggested quantity meets the minimum order quantity
        if (suggestedOrderQuantity < minMoq) {
            suggestedOrderQuantity = minMoq;
        }


        suggestions.push({
          product_id: product.product_id,
          product_name: product.name,
          current_quantity_on_hand: quantityOnHand,
          average_daily_sales: averageDailySales,
          avg_lead_time_days: avgLeadTimeDays,
          safety_stock_percentage: safetyStockPercentage,
          calculated_reorder_point: calculatedReorderPoint,
          suggested_order_quantity: suggestedOrderQuantity,
          reason: `Current stock (${quantityOnHand}) is below calculated reorder point (${calculatedReorderPoint}).`
        });
      }
    }

    return NextResponse.json(suggestions);

  } catch (error) {
    console.error("Error in get_reorder_suggestions:", error);
    return NextResponse.json({ error: "Failed to fetch reorder suggestions" }, { status: 500 });
  }
}
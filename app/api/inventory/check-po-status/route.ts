// app/api/inventory/check-po-status/route.ts

import { NextResponse } from 'next/server';
import { purchaseOrders, PurchaseOrder } from '../../data'; // Adjust path
import { parseISO, differenceInDays, isBefore, isValid } from 'date-fns'; // Using date-fns for robust date handling

// --- Interface for Response Body ---
// This will be a subset or augmented version of PurchaseOrder
interface PoStatusReport {
  po_id: string;
  product_id: string;
  supplier_id: string;
  quantity_ordered: number;
  order_date: string;
  expected_delivery_date: string;
  current_status: 'pending' | 'shipped' | 'delivered' | 'delayed';
  days_overdue?: number; // Optional: only if delayed
  message: string;
}

export async function GET() {
  try {
    const statusReports: PoStatusReport[] = [];
    const now = new Date(); // Current date and time

    for (const po of purchaseOrders) {
      const expectedDate = parseISO(po.expected_delivery_date);

      if (!isValid(expectedDate)) {
        console.warn(`Invalid expected_delivery_date for PO ${po.po_id}: ${po.expected_delivery_date}`);
        continue; // Skip if date is invalid
      }

      let currentStatus = po.status;
      let daysOverdue = 0;
      let message = `PO is currently ${po.status}.`;

      // Check for delays only if status is pending and expected date has passed
      if (po.status === 'pending' || po.status === 'shipped') { // Can be delayed if shipped but not delivered
        if (isBefore(expectedDate, now)) {
          // If expected delivery date is in the past
          daysOverdue = differenceInDays(now, expectedDate);
          if (daysOverdue > 0) {
            currentStatus = 'delayed';
            message = `PO is delayed by ${daysOverdue} days. Expected by ${po.expected_delivery_date}.`;
          } else {
            // Expected today or very soon, not yet overdue
             message = `PO expected today or very soon.`;
          }
        }
      } else if (po.status === 'delivered') {
          message = `PO was delivered on ${po.actual_delivery_date}.`;
      }


      statusReports.push({
        po_id: po.po_id,
        product_id: po.product_id,
        supplier_id: po.supplier_id,
        quantity_ordered: po.quantity_ordered,
        order_date: po.order_date,
        expected_delivery_date: po.expected_delivery_date,
        current_status: currentStatus,
        ...(currentStatus === 'delayed' && { days_overdue: daysOverdue }), // Only add if delayed
        message: message,
      });
    }

    return NextResponse.json(statusReports);

  } catch (error) {
    console.error("Error checking PO status:", error);
    return NextResponse.json({ error: "Failed to check purchase order status" }, { status: 500 });
  }
}
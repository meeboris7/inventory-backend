// app/api/inventory/check-po-status/route.ts (UPDATED)

import { NextResponse } from 'next/server';
import { purchaseOrders, PurchaseOrder } from '../../data'; // Adjust path
import { parseISO, differenceInDays, isBefore, isValid } from 'date-fns';

// --- Interface for Response Body ---
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
    const now = new Date(); // Current date and time (e.g., July 8, 2025)

    for (const po of purchaseOrders) {
      const expectedDate = parseISO(po.expected_delivery_date);

      if (!isValid(expectedDate)) {
        console.warn(`Invalid expected_delivery_date for PO ${po.po_id}: ${po.expected_delivery_date}`);
        continue; // Skip if date is invalid
      }

      let currentStatus: PoStatusReport['current_status'] = po.status; // Start with the PO's saved status
      let daysOverdue = 0;
      let message = '';

      // Logic to determine actual status and days overdue
      if (po.status === 'delivered') {
        currentStatus = 'delivered';
        message = `PO was delivered on ${po.actual_delivery_date || 'an unknown date'}.`;
      } else { // For 'pending', 'shipped', or initially 'delayed'
        if (isBefore(expectedDate, now)) {
          // If expected delivery date is in the past, calculate delay
          daysOverdue = differenceInDays(now, expectedDate);
          if (daysOverdue > 0) {
            currentStatus = 'delayed';
            message = `PO is delayed by ${daysOverdue} days. Expected by ${po.expected_delivery_date}.`;
          } else {
            // Expected today or very recently, but not yet truly 'overdue' (daysOverdue > 0)
            currentStatus = po.status; // Revert to its original 'pending'/'shipped' status if not yet overdue
            message = `PO expected today or very soon. Current status: ${po.status}.`;
          }
        } else {
          // Expected delivery date is in the future
          currentStatus = po.status; // Maintain existing status (pending, shipped)
          message = `PO is currently ${po.status}. Expected delivery on ${po.expected_delivery_date}.`;
        }
      }

      statusReports.push({
        po_id: po.po_id,
        product_id: po.product_id,
        supplier_id: po.supplier_id,
        quantity_ordered: po.quantity_ordered,
        order_date: po.order_date,
        expected_delivery_date: po.expected_delivery_date,
        current_status: currentStatus,
        // Only include days_overdue if the status is actually 'delayed' AND daysOverdue > 0
        ...(currentStatus === 'delayed' && daysOverdue > 0 && { days_overdue: daysOverdue }),
        message: message,
      });
    }

    return NextResponse.json(statusReports);

  } catch (error) {
    console.error("Error checking PO status:", error);
    return NextResponse.json({ error: "Failed to check purchase order status" }, { status: 500 });
  }
}
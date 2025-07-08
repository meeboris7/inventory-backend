// app/api/inventory/send-supplier-reminder/route.ts

import { NextResponse } from 'next/server';
import { addSupplierReminder, SupplierReminder } from '../../data'; // Adjust path based on your file structure

// --- Interface for Request Body ---
interface SendSupplierReminderRequest {
  po_id: string;
  supplier_id: string;
  message?: string; // Optional custom message
}

export async function POST(request: Request) {
  try {
    const { po_id, supplier_id, message }: SendSupplierReminderRequest = await request.json();

    if (!po_id || !supplier_id) {
      return NextResponse.json(
        { error: 'Invalid request: po_id and supplier_id are required.' },
        { status: 400 }
      );
    }

    // Simulate sending the reminder by logging it and adding to our mock data
    const defaultMessage = `Urgent: Following up on delayed Purchase Order ${po_id}. Please provide an update.`;
    const reminderMessage = message || defaultMessage;

    const newReminder: Omit<SupplierReminder, 'reminder_id' | 'sent_date'> = {
      po_id: po_id,
      supplier_id: supplier_id,
      message: reminderMessage,
    };

    const createdReminder = addSupplierReminder(newReminder);

    console.log(`Simulating reminder sent for PO ${po_id} to supplier ${supplier_id}. Message: "${reminderMessage}"`);

    return NextResponse.json({
      ...createdReminder,
      message: `Reminder ${createdReminder.reminder_id} successfully sent to supplier ${supplier_id} for PO ${po_id}.`
    });

  } catch (error) {
    console.error("Error sending supplier reminder:", error);
    return NextResponse.json({ error: "Failed to send supplier reminder" }, { status: 500 });
  }
}
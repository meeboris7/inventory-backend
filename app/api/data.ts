// app/api/data.ts


export interface Product {
  product_id: string;
  name: string;
  sku: string;
  description: string;
  unit_cost: number;
  retail_price: number;
  safety_stock_percentage: number; // e.g., 0.15 for 15%
  average_daily_sales_last_30_days: number;
}

export interface Stock {
  product_id: string;
  quantity_on_hand: number;
  warehouse_location: string;
  last_updated_timestamp: string; // ISO string
}

export interface SupplierProductDetail {
  price: number;
  moq: number;
}

export interface Supplier {
  supplier_id: string;
  name: string;
  contact_person: string;
  email: string;
  phone: string;
  average_lead_time_days: number;
  historical_on_time_delivery_rate: number; // e.g., 0.95
  products_supplied: { [key: string]: SupplierProductDetail }; // Map product_id to SupplierProductDetail
}

export interface PurchaseOrder {
  po_id: string;
  supplier_id: string;
  product_id: string;
  quantity_ordered: number;
  order_date: string; // ISO string
  expected_delivery_date: string; // ISO string
  actual_delivery_date: string | null; // ISO string or null
  status: 'pending' | 'shipped' | 'delivered' | 'delayed';
}

export interface ReturnTicket {
  return_id: string;
  product_id: string;
  quantity_returned: number;
  return_reason: string;
  return_date: string; // ISO string
  supplier_id: string | null;
}

// --- Mock Data ---
export const products: Product[] = [
  {
    product_id: "P001",
    name: "Eco-Friendly Water Bottle",
    sku: "EFWB001",
    description: "Sustainable and insulated water bottle.",
    unit_cost: 500,
    retail_price: 999,
    safety_stock_percentage: 0.15,
    average_daily_sales_last_30_days: 10
  },
  {
    product_id: "P002",
    name: "Smart Home Hub 2.0",
    sku: "SHH2001",
    description: "Central control for smart devices.",
    unit_cost: 2500,
    retail_price: 4999,
    safety_stock_percentage: 0.20,
    average_daily_sales_last_30_days: 3
  },
  {
    product_id: "P003",
    name: "Organic Coffee Beans (500g)",
    sku: "OCB5001",
    description: "Ethically sourced arabica beans.",
    unit_cost: 300,
    retail_price: 599,
    safety_stock_percentage: 0.10,
    average_daily_sales_last_30_days: 25
  },
  {
    product_id: "P004",
    name: "Ergonomic Office Chair",
    sku: "EOC001",
    description: "Adjustable chair for long working hours.",
    unit_cost: 8000,
    retail_price: 14999,
    safety_stock_percentage: 0.25,
    average_daily_sales_last_30_days: 1
  }
];

export const stock: Stock[] = [
  {
    product_id: "P001",
    quantity_on_hand: 80,
    warehouse_location: "A1",
    last_updated_timestamp: new Date().toISOString()
  },
  {
    product_id: "P002",
    quantity_on_hand: 10,
    warehouse_location: "B2",
    last_updated_timestamp: new Date().toISOString()
  },
  {
    product_id: "P003",
    quantity_on_hand: 150,
    warehouse_location: "C3",
    last_updated_timestamp: new Date().toISOString()
  },
  {
    product_id: "P004",
    quantity_on_hand: 2,
    warehouse_location: "D4",
    last_updated_timestamp: new Date().toISOString()
  }
];

export const suppliers: Supplier[] = [
  {
    supplier_id: "S001",
    name: "Global Supply Co.",
    contact_person: "Alice Smith",
    email: "alice@globalsupply.com",
    phone: "9876543210",
    average_lead_time_days: 7,
    historical_on_time_delivery_rate: 0.95,
    products_supplied: {
      "P001": { "price": 480, "moq": 50 },
      "P002": { "price": 2400, "moq": 5 },
      "P003": { "price": 290, "moq": 100 }
    }
  },
  {
    supplier_id: "S002",
    name: "Rapid Parts Inc.",
    contact_person: "Bob Johnson",
    email: "bob@rapidparts.com",
    phone: "9123456789",
    average_lead_time_days: 3,
    historical_on_time_delivery_rate: 0.85,
    products_supplied: {
      "P001": { "price": 520, "moq": 30 },
      "P002": { "price": 2600, "moq": 3 },
      "P004": { "price": 7900, "moq": 1 }
    }
  },
  {
    supplier_id: "S003",
    name: "Budget Wholesale",
    contact_person: "Charlie Brown",
    email: "charlie@budgetwholesale.com",
    phone: "9988776655",
    average_lead_time_days: 10,
    historical_on_time_delivery_rate: 0.90,
    products_supplied: {
      "P001": { "price": 450, "moq": 100 },
      "P003": { "price": 280, "moq": 200 },
      "P004": { "price": 7500, "moq": 1 }
    }
  }
];

// We need to simulate 'persistence' for POs and Returns in a demo,
// even though in-memory data resets on cold start.
// For a simple demo, we'll initialize them as empty arrays.
// If you need more robust "persistence" for POs/Returns in a demo,
// you'd typically connect to a real (even free-tier) database like Vercel Postgres/Supabase.
// For now, these arrays will be modified directly, knowing they reset.
export const purchaseOrders: PurchaseOrder[] = [
  {
    po_id: "PO-20250601-001",
    supplier_id: "S001",
    product_id: "P003",
    quantity_ordered: 200,
    order_date: new Date('2025-06-01T09:00:00Z').toISOString(),
    expected_delivery_date: new Date('2025-06-08T09:00:00Z').toISOString(),
    actual_delivery_date: null,
    status: "delayed"
  },
  {
    po_id: "PO-20250701-002",
    supplier_id: "S002",
    product_id: "P001",
    quantity_ordered: 50,
    order_date: new Date('2025-07-01T10:00:00Z').toISOString(),
    expected_delivery_date: new Date('2025-07-04T10:00:00Z').toISOString(),
    actual_delivery_date: null,
    status: "pending"
  }
];

export const returns: ReturnTicket[] = [
  {
    return_id: "RT-20250615-001",
    product_id: "P001",
    quantity_returned: 5,
    return_reason: "damaged_in_transit",
    return_date: new Date('2025-06-15T14:30:00Z').toISOString(),
    supplier_id: "S001"
  }
];

// Helper functions for data access
export const getProduct = (id: string) => products.find(p => p.product_id === id);
export const getStock = (id: string) => stock.find(s => s.product_id === id);
export const getSupplier = (id: string) => suppliers.find(s => s.supplier_id === id);
export const getAllSuppliers = () => suppliers;
export const getAllPurchaseOrders = () => purchaseOrders;
export const getAllReturns = () => returns;

// Simple update functions for demo (will reset on cold start)
export const updateStockQuantity = (productId: string, change: number) => {
  const item = getStock(productId);
  if (item) {
    item.quantity_on_hand += change;
    item.last_updated_timestamp = new Date().toISOString();
    return true;
  }
  return false;
};

let poCounter = purchaseOrders.length;
export const addPurchaseOrder = (order: Omit<PurchaseOrder, 'po_id' | 'order_date'>) => {
  poCounter++;
  const newPo: PurchaseOrder = {
    po_id: `PO-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${String(poCounter).padStart(3, '0')}`,
    order_date: new Date().toISOString(),
    ...order,
  };
  purchaseOrders.push(newPo);
  return newPo;
};

let returnCounter = returns.length;
export const addReturnTicket = (ticket: Omit<ReturnTicket, 'return_id' | 'return_date'>) => {
  returnCounter++;
  const newReturn: ReturnTicket = {
    return_id: `RT-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${String(returnCounter).padStart(3, '0')}`,
    return_date: new Date().toISOString(),
    ...ticket,
  };
  returns.push(newReturn);
  return newReturn;
};
export interface CustomerType {
  id: string;
  name: string;
  code: string;
  description: string;
}

export interface CustomerInfo {
  id: string;
  code: string;
  name: string;
  typeId: string; // references CustomerType.id
  contactPerson: string;
  tel: string;
  district: string;
  address?: string;
}

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  location?: string;
}

export interface SaleRep {
  id: string;
  name: string;
  code: string;
  phone: string;
}

export interface Item {
  id: string;
  code: string;
  name: string;
  description: string;
  um: string; // Unit of Measure (e.g. Box, Case, Bottle, Pcs)
  price: number;
}

export interface InvoiceItem {
  itemId: string;
  description: string;
  otherField?: string;
  qty: number;
  um: string;
  price: number;
  discountPercent: number; // item level discount
  vatPercent: number;       // item level VAT
  subTotal: number;         // (qty * price) * (1 - disc%) * (1 + vat%)
}

export interface SaleOrder {
  id: string;
  orderNo: string;
  customerId: string;
  date: string;
  warehouseId: string;
  saleRepId: string;
  items: Array<{
    itemId: string;
    description: string;
    qty: number;
    um: string;
    price: number;
    subTotal: number;
  }>;
  totalAmount: number;
  status: 'Pending' | 'Invoiced' | 'Cancelled';
  remark?: string;
}

export interface Invoice {
  id: string;
  type: 'TAX' | 'NON_TAX';
  invoiceNo: string;
  date: string;
  dueDate: string;
  customerId: string;
  contactPerson: string;
  tel: string;
  soNo?: string; // Sales Order reference
  warehouseId: string;
  saleRepId: string;
  district: string;
  remark: string;
  poNo: string;
  accountName: string; // Standard Account (e.g. 1500-Account Receivables)
  className: string;   // Class field
  receiver: string;
  items: InvoiceItem[];
  
  // Total summary blocks
  vatPercentGlobal: number;      // VAT %
  discountPercentGlobal: number; // Discount %
  discountValueGlobal: number;   // Discount ($)
  deposit: number;              // Deposit ($)
  
  subTotalAmount: number; // sum of item-level lines
  vatAmountGlobal: number;
  discountAmountGlobal: number;
  grandTotal: number;
  memo: string;
}

export interface DMSConfig {
  companyName: string;
  companyTIN?: string;
  phone: string;
  email: string;
  address: string;
  currency: string;
}

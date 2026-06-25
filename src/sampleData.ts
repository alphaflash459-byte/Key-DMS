import { CustomerType, CustomerInfo, Warehouse, SaleRep, Item, SaleOrder, Invoice, DMSConfig } from './types';

export const INITIAL_CUSTOMER_TYPES: CustomerType[] = [
  { id: 'ct1', code: 'WS', name: 'Wholesale / បោះដុំ', description: 'Large-scale distributors and wholesale shops' },
  { id: 'ct2', code: 'RET', name: 'Retail Minimart / ម៉ាតលក់រាយ', description: 'Local convenience stores, retail shops, and minimarts' },
  { id: 'ct3', code: 'KA', name: 'Key Account / គណនីសំខាន់ៗ', description: 'Supermarkets, hotels, and large restaurant chains' },
  { id: 'ct4', code: 'AGT', name: 'Authorized Agent / តំណាងចែកចាយ', description: 'Territory specific appointed distributors' },
];

export const INITIAL_CUSTOMERS: CustomerInfo[] = [
  {
    id: 'c1',
    code: 'CUST-001',
    name: 'Seng Hour Wholesale (សេង ហួរ បោះដុំ)',
    typeId: 'ct1',
    contactPerson: 'Mr. Seng Hour',
    tel: '012 345 678',
    district: 'Prampi Makara (7 មករា)',
    address: 'No 45, St 138, Phnom Penh'
  },
  {
    id: 'c2',
    code: 'CUST-002',
    name: 'Phnom Penh Superstore (ភ្នំពេញ ស៊ុបពើស្គរ)',
    typeId: 'ct3',
    contactPerson: 'Mrs. Dara Sovann',
    tel: '016 789 123',
    district: 'Sen Sok (សែនសុខ)',
    address: 'St 1986, Boeung Kak II, Sen Sok, Phnom Penh'
  },
  {
    id: 'c3',
    code: 'CUST-003',
    name: 'Lucky Supermarket Sihanoukville',
    typeId: 'ct3',
    contactPerson: 'Srey Roth Chan',
    tel: '010 555 444',
    district: 'Sihanoukville (ព្រះសីហនុ)',
    address: 'Ekareach Street, Buong Reang, Sihanoukville'
  },
  {
    id: 'c4',
    code: 'CUST-004',
    name: 'Srey Mom Minimart (ស្រីមុំ ម៉ាត)',
    typeId: 'ct2',
    contactPerson: 'Mrs. Srey Mom',
    tel: '099 222 333',
    district: 'Daun Penh (ដូនពេញ)',
    address: 'St 172, Daun Penh, Phnom Penh'
  },
  {
    id: 'c5',
    code: 'CUST-005',
    name: 'Kandal Beer Garden (កណ្តាល ប៊ីយហ្គាឌិន)',
    typeId: 'ct2',
    contactPerson: 'Mr. Keo Piseth',
    tel: '077 445 221',
    district: 'Ta Khmau (តាខ្មៅ)',
    address: 'National Road 2, Ta Khmau, Kandal'
  }
];

export const INITIAL_WAREHOUSES: Warehouse[] = [
  { id: 'wh1', code: 'SRA', name: 'SRA Drinkshop', location: 'Tuol Kouk, Phnom Penh' },
  { id: 'wh2', code: 'PPC', name: 'Phnom Penh Central Warehouse', location: 'National Road 4, Phnom Penh' },
  { id: 'wh3', code: 'SSH', name: 'Sen Sok Hub', location: 'Sen Sok district, Phnom Penh' }
];

export const INITIAL_SALE_REPS: SaleRep[] = [
  { id: 'sr1', code: 'SR-001', name: 'Sok Chea (សុខ ជា)', phone: '012 888 999' },
  { id: 'sr2', code: 'SR-002', name: 'Vannak Long (វណ្ណៈ ឡុង)', phone: '093 777 555' },
  { id: 'sr3', code: 'SR-003', name: 'Srey Neang Chan (ស្រីនាង ចាន់)', phone: '085 444 333' }
];

export const INITIAL_ITEMS: Item[] = [
  { 
    id: 'i1', 
    code: 'ITEM-AG1', 
    name: 'Angkor Beer (Bottle 330ml)', 
    description: 'Angkor Beer Case of 24 Bottles', 
    um: 'Case', 
    price: 12.50,
    promoPackages: [
      { buyQty: 100, freeQty: 32, packageName: 'ទិញ 100 ថែម 32 (Buy 100 Get 32 Free)' },
      { buyQty: 50, freeQty: 15, packageName: 'ទិញ 50 ថែម 15 (Buy 50 Get 15 Free)' },
      { buyQty: 10, freeQty: 2, packageName: 'ទិញ 10 ថែម 2 (Buy 10 Get 2 Free)' }
    ]
  },
  { 
    id: 'i2', 
    code: 'ITEM-CB2', 
    name: 'Cambodia Beer (Can 330ml)', 
    description: 'Cambodia Beer Case of 24 Cans (ស្រាបៀរកម្ពុជា)', 
    um: 'Case', 
    price: 11.80,
    promoPackages: [
      { buyQty: 100, freeQty: 32, packageName: 'ទិញ 100 ថែម 32 (Buy 100 Get 32 Free)' },
      { buyQty: 50, freeQty: 14, packageName: 'ទិញ 50 ថែម 14 (Buy 50 Get 14 Free)' },
      { buyQty: 10, freeQty: 2, packageName: 'ទិញ 10 ថែម 2 (Buy 10 Get 2 Free)' }
    ]
  },
  { id: 'i3', code: 'ITEM-HN3', name: 'Hanuman Premium Lager', description: 'Hanuman Premium Case of 24 Cans (ស្រាបៀរហនុមាន)', um: 'Case', price: 13.50 },
  { id: 'i4', code: 'ITEM-CC4', name: 'Coca-Cola Classic (320ml)', description: 'Coca-Cola Original Taste Case of 24 Cans', um: 'Case', price: 8.20 },
  { id: 'i5', code: 'ITEM-VT5', name: 'Vital Mineral Water (500ml)', description: 'Vital Premium Mineral Water Box of 24 Bottles', um: 'Box', price: 3.50 },
  { id: 'i6', code: 'ITEM-KS6', name: 'Kulara Tonle Sap Springs (1.5L)', description: 'Kulara Natural Spr. Water Case of 6 Bottles', um: 'Case', price: 4.80 },
  { id: 'i7', code: 'ITEM-SP7', name: 'Sprite Lemon-Lime (320ml)', description: 'Sprite Soda Case of 24 Cans', um: 'Case', price: 7.90 },
  { id: 'i8', code: 'ITEM-FT8', name: 'Fanta Orange (320ml)', description: 'Fanta Orange Case of 24 Cans', um: 'Case', price: 7.90 }
];

export const INITIAL_SALE_ORDERS: SaleOrder[] = [
  {
    id: 'so-1',
    orderNo: 'SO-260101',
    customerId: 'c1',
    date: '2026-06-15',
    warehouseId: 'wh1',
    saleRepId: 'sr1',
    items: [
      { itemId: 'i1', description: 'Angkor Beer Case of 24 Bottles', qty: 50, um: 'Case', price: 12.50, subTotal: 625.00 },
      { itemId: 'i2', description: 'Cambodia Beer Case of 24 Cans', qty: 30, um: 'Case', price: 11.80, subTotal: 354.00 }
    ],
    totalAmount: 979.00,
    status: 'Invoiced',
    remark: 'Deliver by Monday afternoon'
  },
  {
    id: 'so-2',
    orderNo: 'SO-260102',
    customerId: 'c2',
    date: '2026-06-18',
    warehouseId: 'wh2',
    saleRepId: 'sr2',
    items: [
      { itemId: 'i3', description: 'Hanuman Premium Case of 24 Cans', qty: 100, um: 'Case', price: 13.50, subTotal: 1350.00 },
      { itemId: 'i5', description: 'Vital Premium Mineral Water Box of 24 Bottles', qty: 40, um: 'Box', price: 3.50, subTotal: 140.00 }
    ],
    totalAmount: 1490.00,
    status: 'Pending',
    remark: 'Call customer before delivery'
  }
];

export const INITIAL_INVOICES: Invoice[] = [
  {
    id: 'inv-1',
    type: 'NON_TAX',
    invoiceNo: 'INV030605',
    date: '2026-06-19',
    dueDate: '2026-07-19',
    customerId: 'c1',
    contactPerson: 'Mr. Seng Hour',
    tel: '012 345 678',
    soNo: 'SO-260101',
    warehouseId: 'wh1',
    saleRepId: 'sr1',
    district: 'Prampi Makara (7 មករា)',
    remark: 'សូមកុំភ្លេចទទួលយកបង្កាន់ដៃទទួលទឹកប្រាក់ និងចុះហត្ថលេខាឱ្យបានត្រឹមត្រូវ ដើម្បីបញ្ជាក់ពីការបង់ប្រាក់របស់លោកអ្នក;- ទំនិញដែលទិញរួចហើយមិនអាចដូរយកលុយវិញបានទេ',
    poNo: 'PO-99182',
    accountName: '1500-Account Receivables',
    className: 'Class-A',
    receiver: 'Ly Houng',
    items: [
      {
        itemId: 'i1',
        description: 'Angkor Beer Case of 24 Bottles',
        otherField: 'Batch-A3',
        qty: 50,
        um: 'Case',
        price: 12.50,
        discountPercent: 0,
        vatPercent: 0,
        subTotal: 625.00
      },
      {
        itemId: 'i2',
        description: 'Cambodia Beer Case of 24 Cans (ស្រាបៀរកម្ពុជា)',
        otherField: 'Batch-C2',
        qty: 30,
        um: 'Case',
        price: 11.80,
        discountPercent: 0,
        vatPercent: 0,
        subTotal: 354.00
      }
    ],
    vatPercentGlobal: 10,
    discountPercentGlobal: 2,
    discountValueGlobal: 0,
    deposit: 100,
    subTotalAmount: 979.00,
    vatAmountGlobal: 97.90,
    discountAmountGlobal: 19.58,
    grandTotal: 957.32, // SubTotal (979) + VAT (97.90) - Disc (19.58) - Deposit (100)
    memo: 'Paid partial deposit $100. Outstanding amount is $857.32'
  },
  {
    id: 'inv-2',
    type: 'TAX',
    invoiceNo: 'T-INV001202',
    date: '2026-06-20',
    dueDate: '2026-07-20',
    customerId: 'c2',
    contactPerson: 'Mrs. Dara Sovann',
    tel: '016 789 123',
    soNo: '',
    warehouseId: 'wh2',
    saleRepId: 'sr2',
    district: 'Sen Sok (សែនសុខ)',
    remark: 'ពន្ធប្រថាប់ត្រាជាបន្ទុករបស់អតិថិជន / VAT 10% Included in Official Tax Invoice.',
    poNo: 'PO-288301',
    accountName: '1500-Account Receivables',
    className: 'Class-A',
    receiver: 'Odom Phalla',
    items: [
      {
        itemId: 'i3',
        description: 'Hanuman Premium Case of 24 Cans (ស្រាបៀរហនុមាន)',
        otherField: 'H-Prem',
        qty: 120,
        um: 'Case',
        price: 13.50,
        discountPercent: 5, // 5% discount
        vatPercent: 10,     // 10% VAT
        subTotal: 1692.90   // 120 * 13.5 * 0.95 * 1.1 = 1692.90
      }
    ],
    vatPercentGlobal: 10,
    discountPercentGlobal: 0,
    discountValueGlobal: 50.00,
    deposit: 500.00,
    subTotalAmount: 1692.90,
    vatAmountGlobal: 169.29,
    discountAmountGlobal: 50.00,
    grandTotal: 1312.19, // 1692.90 + 169.29 - 50.00 - 500.00 = 1312.19
    memo: 'Delivered directly to main warehouse entrance. Official invoice stamped.'
  }
];

export const INITIAL_CONFIG: DMSConfig = {
  companyName: 'RAKOT TCS Co., Ltd.',
  companyTIN: 'K002-990182740',
  phone: '+855 (0) 23 888 777',
  email: 'info@rakot-tcs.com.kh',
  address: 'Building 12A, Russian Federation Blvd, Phnom Penh, Cambodia',
  currency: 'USD'
};

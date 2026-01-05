// Base API Response Type
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  count?: number;
  total?: number;
  page?: number;
  pages?: number;
  errors?: any[];
}

// Pagination Parameters
export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'stock-manager' | 'employee';
  department?: string | null;
  isactive: boolean;
  createdat: Date;
  lastlogin?: Date | null;
  profilepicture?: string | null;
  phone?: string | null;
  address?: string | null;
  location?: string | null;
  bio?: string | null;
}


export interface InventoryItem {
  id: string;
  uniqueid: string;
  financialyear: string;
  assetcategory: string;
  categoryname?: string; // Added for display purposes
  dateofinvoice: Date | null;
  dateofentry: Date | null;
  invoicenumber: string;
  assetcategoryid: string;
  assetid?: string; // Added to match database schema
  assetname: string;
  specification: string;
  makemodel: string;
  productserialnumber?: string;
  vendorname: string;
  quantityperitem: number;
  rateinclusivetax: number;
  totalcost: number;
  locationofitem: string;
  issuedto?: string;
  issuedby?: string; // Added for tracking who issued the item
  dateofissue?: Date | null;
  issueddate?: Date | null; // Added as alias for dateofissue
  expectedreturndate?: Date | null;
  balancequantityinstock: number;
  description: string;
  unitofmeasurement: string;
  depreciationmethod?: string;
  warrantyinformation?: string;
  maintenanceschedule?: string;
  conditionofasset: 'excellent' | 'good' | 'fair' | 'poor' | 'damaged';
  status: 'available' | 'issued' | 'maintenance' | 'retired';
  minimumstocklevel: number;
  purchaseordernumber?: string;
  expectedlifespan?: string;
  annualmanagementcharge?: number;
  attachments?: { name: string; url: string }[] | File[]; // Can be URLs from DB or Files during upload
  lastmodifiedby: string;
  lastmodifieddate: Date;
  createdat: Date;
}

export interface Attachment {
  name: string;
  url: string;
}


export interface Request {
  id: string;
  employeeid: string;
  employeename: string;
  itemtype: string;
  quantity: number;
  purpose: string;
  justification: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedat: Date;
  reviewedat?: Date;
  reviewedby?: string;
  reviewername?: string;
  remarks?: string;
  rejectionReason?: string;
  inventoryItemId?: string | { _id: string; id?: string; uniqueid?: string; assetname?: string };
  inventoryitemid?: string | { _id: string; id?: string; uniqueid?: string; assetname?: string };
}

export interface CategoryAsset {
  id: string;
  assetname: string;
  createdat?: Date;
}

export interface Category {
  id: string;
  name: string;
  type: 'major' | 'minor';
  description?: string;
  assets?: CategoryAsset[]; // Array of asset objects with IDs
  assetnames?: (string | CategoryAsset)[]; // Can be strings or objects with id/assetname
  isactive: boolean;
  createdat: Date;
  updatedat: Date;
  createdby: string;
}

export interface Asset {
  id: string;
  name: string;
  description?: string;
  assetcategory?: string;
  isactive: boolean;
  createdat: Date;
  updatedat: Date;
  createdby: string;
}

// export interface Notification {
//   id: string;
//   userId: string;
//   type: 'request' | 'approval' | 'rejection' | 'low-stock' | 'system';
//   title: string;
//   message: string;
//   isread: boolean;
//   createdat: Date;
// }


export interface Notification {
  employeeid: string;
  employeename: string;
  itemtype: string;
  justification: string;
  purpose: string;
  quantity: number;
  remarks?: string | null;
  reviewedat?: string | null;
  reviewedby?: string | null;
  reviewername?: string | null;
  status: 'pending' | 'approved' | 'rejected';
  submittedat: string;
}

// Location Interface
export interface Location {
  id: string;
  name: string;
  building?: string;
  floor?: string;
  room?: string;
  capacity?: number;
  manager?: string;
  description?: string;
  isactive: boolean;
  createdat: Date;
  updatedat: Date;
  createdby: string;
}

// Transaction/Inventory Movement Interface
export interface InventoryTransaction {
  id: string;
  inventoryitemid: string;
  itemname?: string;
  type: 'issue' | 'return' | 'transfer' | 'adjustment';
  quantity: number;
  fromuser?: string;
  touser?: string;
  fromlocation?: string;
  tolocation?: string;
  status: 'pending' | 'approved' | 'completed' | 'cancelled';
  notes?: string;
  approvedby?: string;
  approvedat?: Date;
  completedat?: Date;
  createdat: Date;
  createdby: string;
}

// Dashboard Stats Interface
export interface DashboardStats {
  totalInventory: number;
  totalValue: number;
  lowStockItems: number;
  pendingRequests: number;
  issuedItems: number;
  availableItems: number;
  maintenanceItems: number;
  retiredItems: number;
}

// NotificationSettings Interface
export interface NotificationSettings {
  id: string;
  userid: string;
  emailnotifications: boolean;
  pushnotifications: boolean;
  lowstockalerts: boolean;
  requestupdates: boolean;
  systemalerts: boolean;
  updatedat: Date;
}

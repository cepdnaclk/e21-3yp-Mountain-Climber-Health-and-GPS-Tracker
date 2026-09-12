export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'customer';
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  category: 'hardware' | 'software';
  price: number;
  stock_count: number;
  image_url: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Device {
  id: string;
  product_id: string;
  serial_number: string;
  batch_id: string | null;
  status: 'available' | 'registered' | 'defective';
  created_at: string;
  products?: Product;
}

export interface DeviceRegistration {
  id: string;
  user_id: string;
  device_id: string;
  registered_at: string;
  approved_by_admin: boolean;
  devices?: Device;
  users?: User;
}

export interface Order {
  id: string;
  user_id: string;
  total_amount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shipping_address: string;
  created_at: string;
  updated_at: string;
  users?: User;
  order_items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  created_at: string;
  products?: Product;
}

export interface SoftwarePackage {
  id: string;
  product_id: string;
  name: string;
  version: string;
  description: string;
  file_url: string;
  file_size_bytes: number;
  is_active: boolean;
  uploaded_at: string;
  products?: Product;
}

export interface AdminLog {
  id: string;
  admin_id: string;
  action: string;
  target_type: string;
  target_id: string;
  created_at: string;
  users?: User;
}

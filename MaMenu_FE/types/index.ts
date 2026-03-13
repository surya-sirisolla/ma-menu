export interface User {
  id: string
  name: string
  email: string
  phone: string
  role: 'super_admin' | 'hotel_admin'
  hotel_ids?: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Hotel {
  id: string
  name: string
  owner_id: string
  phone: string
  email: string
  address: string
  city: string
  state: string
  country: string
  pincode: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Table {
  id: string
  hotel_id: string
  number: number
  label: string
  capacity: number
  qr_code: string
  is_active: boolean
  is_occupied: boolean
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  hotel_id: string
  name: string
  type: string
  parent_id?: string
  sort_order: number
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export interface CategoryTree extends Category {
  children?: CategoryTree[]
}

export interface MenuItem {
  id: string
  hotel_id: string
  category_id: string
  name: string
  description: string
  price: number
  image_url: string
  is_veg: boolean
  is_available: boolean
  tags?: string[]
}

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled'

export interface OrderItem {
  item_id: string
  name: string
  price: number
  quantity: number
  is_veg: boolean
}

export interface Order {
  id: string
  hotel_id: string
  table_number: number
  table_label: string
  customer_name: string
  items: OrderItem[]
  status: OrderStatus
  total_amount: number
  notes: string
  created_at: string
  updated_at: string
}

// Cart item used client-side only (extends MenuItem with quantity)
export interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  is_veg: boolean
  image_url?: string
}

// Public menu response shape
export interface CategoryMenuNode {
  id: string
  hotel_id: string
  name: string
  type: string
  parent_id?: string
  sort_order: number
  is_active: boolean
  children?: CategoryMenuNode[]
  items?: MenuItem[]
}

export interface PublicMenuResponse {
  hotel: Hotel
  categories: CategoryMenuNode[]
  tables: Table[]
}

export interface AuthPayload {
  user_id: string
  email: string
  role: string
  hotel_id?: string
  exp: number
}

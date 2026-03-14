import { getToken } from '@/lib/auth'
import type { User, Hotel, Table, Category, CategoryTree, MenuItem, Order, OrderStatus, PublicMenuResponse } from '@/types'

const BASE = '/api/v1'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken()
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
    throw new Error(body.error ?? `HTTP ${res.status}`)
  }

  return res.json() as Promise<T>
}

// ---- Auth ----

export function login(email: string, password: string) {
  return request<{ message: string; token: string; default_hotel?: Hotel }>(
    '/auth/login',
    { method: 'POST', body: JSON.stringify({ userId: email, password }) }
  )
}

// ---- Super Admin ----

export function getHotelOwners() {
  return request<{ data: User[] }>('/admin/hotel-owners')
}

export function createHotelOwner(data: {
  name: string
  email: string
  phone: string
  password: string
}) {
  return request<{ message: string; data: User }>('/admin/hotel-owners', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function updateHotelOwner(id: string, data: {
  name?: string
  email?: string
  phone?: string
  is_active?: boolean
}) {
  return request<{ message: string }>(`/admin/hotel-owners/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export function deleteHotelOwner(id: string) {
  return request<{ message: string }>(`/admin/hotel-owners/${id}`, { method: 'DELETE' })
}

export function getHotels() {
  return request<{ data: Hotel[] }>('/admin/hotels')
}

export function updateHotel(id: string, data: {
  name?: string
  phone?: string
  email?: string
  address?: string
  city?: string
  state?: string
  country?: string
  pincode?: string
  is_active?: boolean
}) {
  return request<{ message: string }>(`/admin/hotels/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export function deleteHotel(id: string) {
  return request<{ message: string }>(`/admin/hotels/${id}`, { method: 'DELETE' })
}

export function createHotel(data: {
  name: string
  owner_id: string
  phone: string
  email: string
  address: string
  city: string
  state: string
  country: string
  pincode: string
}) {
  return request<{ message: string; data: Hotel }>('/admin/hotels', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

// ---- Hotel Owner — Profile ----

export function getProfile() {
  return request<{ user: User; active_hotel: Hotel | null }>('/hotel/profile')
}

export function getMyHotels() {
  return request<{ data: Hotel[] }>('/hotel/my-hotels')
}

export function switchHotel(hotel_id: string) {
  return request<{ message: string; token: string; active_hotel: Hotel }>(
    '/hotel/switch',
    { method: 'PUT', body: JSON.stringify({ hotel_id }) }
  )
}

// ---- Hotel Owner — Tables ----

export function getTables() {
  return request<{ data: Table[] }>('/hotel/tables')
}

export function createTable(data: { number: number; label: string; capacity: number }) {
  return request<{ message: string; data: Table }>('/hotel/tables', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function updateTable(id: string, data: { label?: string; capacity?: number }) {
  return request<{ message: string }>(`/hotel/tables/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export function setTableStatus(id: string, is_occupied: boolean) {
  return request<{ message: string }>(`/hotel/tables/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ is_occupied }),
  })
}

export function deleteTable(id: string) {
  return request<{ message: string }>(`/hotel/tables/${id}`, { method: 'DELETE' })
}

// ---- Hotel Owner — Categories ----

export function getCategories() {
  return request<{ data: CategoryTree[] }>('/hotel/categories')
}

export function createCategory(data: {
  name: string
  type: string
  parent_id?: string
  sort_order?: number
}) {
  return request<{ message: string; data: Category }>('/hotel/categories', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function updateCategory(id: string, data: { name?: string; type?: string; sort_order?: number }) {
  return request<{ message: string }>(`/hotel/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export function deleteCategory(id: string) {
  return request<{ message: string }>(`/hotel/categories/${id}`, { method: 'DELETE' })
}

// ---- Hotel Owner — Menu ----

export function getMenuItems(category_id?: string) {
  const qs = category_id ? `?category_id=${category_id}` : ''
  return request<{ data: MenuItem[] }>(`/hotel/menu${qs}`)
}

export function createMenuItem(data: {
  category_id: string
  name: string
  description?: string
  price: number
  image_url?: string
  is_veg: boolean
  tags?: string[]
  sort_order?: number
}) {
  return request<{ message: string; data: MenuItem }>('/hotel/menu', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function updateMenuItem(id: string, data: Partial<{
  name: string
  description: string
  price: number
  image_url: string
  is_veg: boolean
  tags: string[]
  sort_order: number
}>) {
  return request<{ message: string }>(`/hotel/menu/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export function toggleAvailability(id: string, is_available: boolean) {
  return request<{ message: string }>(`/hotel/menu/${id}/availability`, {
    method: 'PUT',
    body: JSON.stringify({ is_available }),
  })
}

export function deleteMenuItem(id: string) {
  return request<{ message: string }>(`/hotel/menu/${id}`, { method: 'DELETE' })
}

// ---- Public Menu ----

export function getPublicMenu(hotelId: string) {
  return fetch(`/api/v1/public/menu/${hotelId}`).then(async (res) => {
    if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(b.error ?? 'Not found') }
    return res.json() as Promise<PublicMenuResponse>
  })
}

// ---- Public Orders ----

export function placeOrder(hotelId: string, data: {
  table_number: number
  table_label: string
  customer_name: string
  notes: string
  items: { item_id: string; quantity: number }[]
}) {
  return fetch(`/api/v1/public/orders/${hotelId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(async (res) => {
    if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(b.error ?? 'Failed to place order') }
    return res.json() as Promise<{ message: string; data: Order }>
  })
}

// ---- Hotel Admin Orders ----

export function getOrders(status?: string) {
  const qs = status ? `?status=${status}` : ''
  return request<{ data: Order[] }>(`/hotel/orders${qs}`)
}

export function updateOrderStatus(id: string, status: OrderStatus) {
  return request<{ message: string; status: OrderStatus }>(`/hotel/orders/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  })
}

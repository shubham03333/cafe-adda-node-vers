export interface MenuItem {
  id: number;
  name: string;
  price: number;
  is_available: boolean;
  category: string;
}

export interface OrderItem extends MenuItem {
  quantity: number;
}

export interface Order {
  id: string;
  order_number: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'preparing' | 'ready' | 'served' | 'cancelled';
  order_time: string;
  updated_time?: string;
}

export interface CreateOrderRequest {
  order_number: string;
  items: OrderItem[];
  total: number;
}

export interface UpdateOrderRequest {
  items?: OrderItem[];
  total?: number;
  status?: Order['status'];
}
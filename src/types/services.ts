export interface ServiceItem {
  id: string;
  title: string;
  short_description: string;
  description: string;
  price: number;
  category: 'Fitting' | 'Inspection' | 'Maintenance' | 'Consultation';
  estimated_duration: string;
  features: string[];
  icon_name?: string;
  image_url?: string;
  is_active: boolean;
  is_checkout_addon?: boolean;
  created_at: string;
}

export type ServiceBookingStatus = 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface ServiceBooking {
  id: string;
  service_id: string;
  service_title: string;
  service_price: number;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  address: string;
  city: string;
  state?: string;
  pincode: string;
  preferred_date: string;
  preferred_time_slot?: string;
  notes?: string;
  status: ServiceBookingStatus;
  order_id?: string;
  created_at: string;
}

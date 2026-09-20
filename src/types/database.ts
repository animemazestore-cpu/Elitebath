export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: 'user' | 'admin';
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  image_url: string;
  size_enabled: boolean;
  created_at: string;
}

export interface VariantOptionValue {
  id: string; // e.g. "matte-black"
  label: string; // e.g. "Matte Black"
  colorHex?: string; // e.g. "#111827"
  image?: string;
}

export interface VariantOptionConfig {
  id: string; // "color" | "size" | "finish" | "material" | "model" | custom string
  name: string; // "Color" | "Size" | "Finish" | "Material" | "Model"
  type?: 'color' | 'select' | 'button' | 'radio';
  values: (string | VariantOptionValue)[];
  required?: boolean;
}

export interface ProductVariantConfig {
  enabledOptions: string[]; // e.g. ["color", "finish"]
  options: VariantOptionConfig[];
}

export interface ProductVariant {
  id: string;
  product_id: string;
  sku?: string | null;
  price: number;
  stock: number;
  image_url?: string | null;
  attributes: Record<string, string>; // e.g. { color: "Matte Black", finish: "Matte" }
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category_id: string | null;
  price: number;
  stock: number;
  featured: boolean;
  main_image_url: string;
  additional_images: string[]; // JSON array of string URLs
  created_at: string;
  category?: Category; // Joined category details

  // Sanitaryware specifications & variant architecture
  sku?: string | null;
  brand?: string | null;
  material?: string | null;
  finish?: string | null;
  warranty_info?: string | null;
  has_variants?: boolean;
  variant_config?: ProductVariantConfig | null;
  variants?: ProductVariant[]; // Joined product_variants
  is_new_arrival?: boolean;
  is_active?: boolean;
}

export type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'PROCESSING'
  | 'PACKED'
  | 'SHIPPED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'PENDING_VERIFICATION';

export type PaymentStatus = 'PENDING_PAYMENT' | 'PAID' | 'COMPLETED' | 'FAILED' | 'PENDING_VERIFICATION';

export interface ShippingAddress {
  fullName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  country?: string;
  landmark?: string;
  transactionId?: string;
  paymentMethod?: string;
  paymentId?: string;
  fampay_order_id?: string;
  fampay_utr?: string;
  tracking_info?: {
    carrier: string;
    tracking_number: string;
    shipped_at: string;
  };
  item_variants?: any[];
}

export interface Order {
  id: string;
  user_id: string | null;
  total_amount: number;
  status: OrderStatus;
  payment_status: PaymentStatus;
  shipping_address: ShippingAddress;
  created_at: string;
  estimated_delivery_date: string | null;
  profile?: Profile;
  items?: OrderItem[];
  payment_proof?: PaymentProof;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  quantity: number;
  price: number;
  selected_variant?: string | null;
  selected_variant_id?: string | null;
  selected_attributes?: Record<string, string> | null;
  product?: Product;
  variant?: ProductVariant;
}

export interface PaymentProof {
  id: string;
  order_id: string;
  screenshot_url: string;
  uploaded_at: string;
}

export interface WishlistItem {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
  product?: Product;
}

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  user_name: string;
  rating: number;
  review_text: string;
  review_images: string[]; // Array of image URLs
  verified_purchase: boolean;
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
  created_at: string;
  likes_count?: number;
  is_liked_by_user?: boolean;
}

export interface ProductQuestion {
  id: string;
  product_id: string;
  user_id: string | null;
  question: string;
  answer: string | null;
  created_at: string;
  profile?: {
    full_name: string | null;
  };
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  created_at: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  created_at: string;
}

export type ReplacementStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'PROCESSING' | 'RESOLVED';

export interface ReplacementRequest {
  id: string;
  order_id: string;
  user_id: string;
  reason: string;
  description: string;
  photo_url?: string | null;
  status: ReplacementStatus;
  admin_notes?: string | null;
  created_at: string;
  // joined
  order?: Order;
}

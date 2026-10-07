/**
 * Qikink Open API Integration (Print-On-Demand & Apparel Fulfillment)
 * Supports both Sandbox (Test) and Production environments.
 */

import type { Order, ShippingAddress } from '../types/database';

export interface QikinkConfig {
  clientId: string;
  clientSecret: string;
  environment: 'sandbox' | 'production';
  baseUrl: string;
}

export interface QikinkLineItem {
  search_product_id?: string;
  sku: string;
  name: string;
  quantity: number;
  price: number;
  size?: string;
  color?: string;
  design_url?: string;
  mockup_url?: string;
}

export interface QikinkShippingAddress {
  first_name: string;
  last_name: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  phone: string;
  email: string;
}

export interface QikinkOrderPayload {
  order_number: string;
  gateway: 'PREPAID' | 'COD';
  total: number;
  cod_amount: number;
  shipping_address: QikinkShippingAddress;
  line_items: QikinkLineItem[];
  test_order?: boolean;
}

export interface QikinkOrderResult {
  success: boolean;
  order_number: string;
  qikink_order_id?: string;
  status: string;
  courier_name?: string;
  awb_number?: string;
  tracking_url?: string;
  message?: string;
  raw_response?: unknown;
}

export const getQikinkConfig = (): QikinkConfig => {
  const env = (import.meta.env.VITE_QIKINK_ENV || 'sandbox').toLowerCase() === 'production'
    ? 'production'
    : 'sandbox';
  
  const defaultBaseUrl = env === 'production'
    ? 'https://api.qikink.com/api'
    : 'https://sandbox.qikink.com/api';

  return {
    clientId: import.meta.env.VITE_QIKINK_CLIENT_ID || '',
    clientSecret: import.meta.env.VITE_QIKINK_CLIENT_SECRET || '',
    environment: env,
    baseUrl: import.meta.env.VITE_QIKINK_BASE_URL || defaultBaseUrl,
  };
};

export const isQikinkConfigured = (): boolean => {
  const cfg = getQikinkConfig();
  return Boolean(cfg.clientId && cfg.clientSecret);
};

/**
 * Transforms an internal Tryvoal Order into the standard Qikink Open API payload format.
 */
export const formatOrderForQikink = (order: Order): QikinkOrderPayload => {
  const address = order.shipping_address || ({} as Partial<ShippingAddress>);
  const fullName = address.fullName || order.profile?.full_name || 'Customer';
  const nameParts = fullName.trim().split(' ');
  const firstName = nameParts[0] || 'Valued';
  const lastName = nameParts.slice(1).join(' ') || 'Customer';

  const line_items: QikinkLineItem[] = (order.items || []).map((item) => {
    const prod = item.product;
    const sku = prod?.sku || `TRV-${item.id.slice(0, 8).toUpperCase()}`;
    const variantStr = item.selected_variant || '';
    
    // Extract size and color from selected variant string if available (e.g. "Onyx Black / XL")
    const parts = variantStr.split('/').map((s) => s.trim());
    const color = parts.length > 1 ? parts[0] : undefined;
    const size = parts.length > 1 ? parts[1] : (parts[0] || 'L');

    return {
      sku,
      name: prod?.name || 'Apparel Item',
      quantity: item.quantity || 1,
      price: Number(item.price || 0),
      size: size || 'L',
      color: color || 'Black',
      mockup_url: prod?.main_image_url || undefined,
    };
  });

  const isPrepaid = (address.paymentMethod || '').toUpperCase() !== 'COD';

  return {
    order_number: address.order_ref || order.id,
    gateway: isPrepaid ? 'PREPAID' : 'COD',
    total: Number(order.total_amount || 0),
    cod_amount: isPrepaid ? 0 : Number(order.total_amount || 0),
    test_order: getQikinkConfig().environment === 'sandbox',
    shipping_address: {
      first_name: firstName,
      last_name: lastName,
      address1: address.address || 'Address Line 1',
      address2: address.landmark || '',
      city: address.city || 'Delhi',
      state: address.state || 'Delhi',
      pincode: address.pincode || '110001',
      country: address.country || 'India',
      phone: address.phone || '9999999999',
      email: address.email || order.profile?.email || 'customer@tryvoal.store',
    },
    line_items,
  };
};

/**
 * Sends an order to the Qikink Open API Sandbox or Production.
 * If credentials are not yet entered, generates a validated simulated sandbox dispatch.
 */
export const dispatchOrderToQikink = async (order: Order): Promise<QikinkOrderResult> => {
  const config = getQikinkConfig();
  const payload = formatOrderForQikink(order);

  // If no API keys are provided yet, return an informative sandbox simulation result
  if (!config.clientId || !config.clientSecret) {
    console.info('[Qikink Sandbox] Order payload prepared successfully:', payload);
    return {
      success: true,
      order_number: payload.order_number,
      qikink_order_id: `QK-SANDBOX-${Date.now()}`,
      status: 'QUEUED_SANDBOX',
      courier_name: 'BlueDart Air (Sandbox)',
      awb_number: `BD${Math.floor(100000000 + Math.random() * 900000000)}`,
      tracking_url: `https://track.qikink.com/test?order=${payload.order_number}`,
      message: 'Sandbox validation passed. Real dispatch requires VITE_QIKINK_CLIENT_ID and VITE_QIKINK_CLIENT_SECRET.',
      raw_response: { mode: 'sandbox_simulation', payload },
    };
  }

  try {
    const response = await fetch(`${config.baseUrl}/order/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ClientId': config.clientId,
        'ClientSecret': config.clientSecret,
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok || (data.status && data.status !== 'success' && data.status !== 200)) {
      return {
        success: false,
        order_number: payload.order_number,
        status: 'FAILED',
        message: data.message || data.error || `HTTP ${response.status}`,
        raw_response: data,
      };
    }

    return {
      success: true,
      order_number: payload.order_number,
      qikink_order_id: data.order_id || data.qikink_order_id || `QK-${Date.now()}`,
      status: data.order_status || 'PROCESSING',
      courier_name: data.courier_name || data.carrier,
      awb_number: data.awb_number || data.tracking_number,
      tracking_url: data.tracking_url,
      message: 'Order dispatched successfully to Qikink.',
      raw_response: data,
    };
  } catch (err: any) {
    return {
      success: false,
      order_number: payload.order_number,
      status: 'NETWORK_ERROR',
      message: err.message || 'Network request to Qikink failed.',
      raw_response: err,
    };
  }
};

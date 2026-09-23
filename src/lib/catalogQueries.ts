import { sanitizeSlug } from './persistence';
import type { Category, Product, ProductVariant, ProductVariantConfig } from '../types/database';

export const CATEGORY_FIELDS = 'id, name, image_url, created_at';

export const PRODUCT_VARIANT_FIELDS =
  'id, product_id, sku, price, stock, image_url, attributes, active, created_at, updated_at';

export const PRODUCT_LIST_FIELDS =
  'id, name, slug, description, category_id, price, stock, featured, main_image_url, sku, brand, material, finish, warranty_info, has_variants, variant_config, is_new_arrival, is_active, created_at';

export const PRODUCT_DETAIL_FIELDS =
  'id, name, slug, description, category_id, price, stock, featured, main_image_url, additional_images, sku, brand, material, finish, warranty_info, has_variants, variant_config, is_new_arrival, is_active, created_at';

export const PRODUCT_RELATED_FIELDS =
  'id, name, slug, price, stock, featured, main_image_url, sku, brand, finish, has_variants, created_at';

export const PRODUCT_LIST_SELECT = `
  *,
  category:categories (${CATEGORY_FIELDS}),
  variants:product_variants (${PRODUCT_VARIANT_FIELDS})
`;

export const PRODUCT_DETAIL_SELECT = `
  *,
  category:categories (${CATEGORY_FIELDS}),
  variants:product_variants (${PRODUCT_VARIANT_FIELDS})
`;

export function parseProduct(raw: Record<string, unknown>): Product {
  const category = raw.category as Category | undefined;

  let variantConfig: ProductVariantConfig | null = null;
  if (raw.variant_config) {
    if (typeof raw.variant_config === 'string') {
      try {
        variantConfig = JSON.parse(raw.variant_config) as ProductVariantConfig;
      } catch {
        variantConfig = null;
      }
    } else if (typeof raw.variant_config === 'object') {
      variantConfig = raw.variant_config as ProductVariantConfig;
    }
  }

  const rawVariants = Array.isArray(raw.variants) ? (raw.variants as Record<string, unknown>[]) : [];
  const variants: ProductVariant[] = rawVariants.map((v) => ({
    id: String(v.id),
    product_id: String(v.product_id ?? raw.id),
    sku: (v.sku as string | null) ?? null,
    price: Number(v.price ?? 0),
    stock: Number(v.stock ?? 0),
    image_url: (v.image_url as string | null) ?? null,
    attributes: (v.attributes as Record<string, string>) || {},
    active: v.active !== false,
    created_at: v.created_at as string | undefined,
    updated_at: v.updated_at as string | undefined,
  }));

  const hasVariants = Boolean(raw.has_variants) || variants.length > 0;

  // Base price fallback: if has variants, display price can be the minimum active variant price
  let displayPrice = Number(raw.price ?? 0);
  if (hasVariants && variants.length > 0) {
    const activeVariants = variants.filter((v) => v.active);
    if (activeVariants.length > 0) {
      const minVariantPrice = Math.min(...activeVariants.map((v) => v.price));
      if (displayPrice === 0 || minVariantPrice < displayPrice) {
        displayPrice = minVariantPrice;
      }
    }
  }

  // Base stock fallback: sum of active variant stocks if base stock is 0
  let totalStock = Number(raw.stock ?? 0);
  if (hasVariants && variants.length > 0 && totalStock === 0) {
    totalStock = variants.reduce((acc, v) => acc + (v.active ? v.stock : 0), 0);
  }

  return {
    id: String(raw.id),
    name: String(raw.name ?? ''),
    slug: sanitizeSlug(String(raw.slug ?? ''), String(raw.name ?? '')),
    description: (raw.description as string | null) ?? null,
    category_id: (raw.category_id as string | null) ?? null,
    price: displayPrice,
    stock: totalStock,
    featured: Boolean(raw.featured),
    main_image_url: String(raw.main_image_url ?? ''),
    additional_images: Array.isArray(raw.additional_images)
      ? (raw.additional_images as string[])
      : [],
    sku: (raw.sku as string | null) ?? null,
    brand: (raw.brand as string | null) ?? 'TRYVOAL',
    material: (raw.material as string | null) ?? null,
    finish: (raw.finish as string | null) ?? null,
    warranty_info: (raw.warranty_info as string | null) ?? null,
    has_variants: hasVariants,
    variant_config: variantConfig,
    variants: variants.length > 0 ? variants : undefined,
    is_new_arrival: Boolean(raw.is_new_arrival),
    is_active: raw.is_active !== false,
    shipping_fee: raw.shipping_fee !== undefined ? Number(raw.shipping_fee) : 0,
    created_at: (raw.created_at as string) || new Date().toISOString(),
    ...(category ? { category } : {}),
  };
}

export function parseProducts(rows: Record<string, unknown>[] | null): Product[] {
  return rows ? rows.map(parseProduct) : [];
}

export function findProductBySlug(products: Product[], slug: string): Product | undefined {
  return products.find(
    (p) => p.slug === slug || sanitizeSlug(p.slug, p.name) === slug
  );
}

// ============================================================================
// Fallback Luxury Apparel Catalog (TRYVOAL - Zero-downtime render)
// ============================================================================

export const FALLBACK_CATEGORIES: Category[] = [
  {
    id: 'cat-tshirts',
    name: 'T-Shirts',
    image_url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=600',
    size_enabled: true,
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'cat-shirts',
    name: 'Shirts',
    image_url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&q=80&w=600',
    size_enabled: true,
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'cat-accessories',
    name: 'Accessories',
    image_url: 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&q=80&w=600',
    size_enabled: false,
    created_at: '2026-01-01T00:00:00Z',
  },
];

export const FALLBACK_PRODUCTS: Product[] = [
  {
    id: 'prod-oversized-heavyweight-tee',
    name: 'Heavyweight Boxy Oversized Tee',
    slug: 'heavyweight-boxy-oversized-tee',
    description:
      'Engineered from ultra-dense 240 GSM organic combed cotton. Features dropped shoulders, a structured boxy cut, ribbed double-needle collar, and anti-shrink reactive dyeing.',
    category_id: 'cat-tshirts',
    category: FALLBACK_CATEGORIES[0],
    price: 1499,
    stock: 85,
    featured: true,
    main_image_url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=800',
    additional_images: [
      'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&q=80&w=800',
    ],
    sku: 'TRV-TEE-HVY',
    brand: 'TRYVOAL',
    material: '100% Organic Combed Cotton (240 GSM)',
    finish: 'Silicone Soft-Wash Pre-Shrunk',
    warranty_info: 'Guaranteed 100+ Washes Colorfastness',
    has_variants: true,
    is_new_arrival: true,
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    variant_config: {
      enabledOptions: ['color', 'size'],
      options: [
        {
          id: 'color',
          name: 'Color',
          type: 'color',
          required: true,
          values: [
            { id: 'onyx-black', label: 'Onyx Black', colorHex: '#18181b' },
            { id: 'cloud-white', label: 'Cloud White', colorHex: '#f8fafc' },
            { id: 'sapphire-navy', label: 'Sapphire Navy', colorHex: '#1e3a8a' },
          ],
        },
        {
          id: 'size',
          name: 'Size',
          type: 'button',
          required: true,
          values: ['S', 'M', 'L', 'XL', 'XXL'],
        },
      ],
    },
    variants: [
      {
        id: 'var-tee-blk-s',
        product_id: 'prod-oversized-heavyweight-tee',
        sku: 'TRV-TEE-BLK-S',
        price: 1499,
        stock: 15,
        image_url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=800',
        attributes: { color: 'Onyx Black', size: 'S' },
        active: true,
      },
      {
        id: 'var-tee-blk-m',
        product_id: 'prod-oversized-heavyweight-tee',
        sku: 'TRV-TEE-BLK-M',
        price: 1499,
        stock: 25,
        image_url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=800',
        attributes: { color: 'Onyx Black', size: 'M' },
        active: true,
      },
      {
        id: 'var-tee-blk-l',
        product_id: 'prod-oversized-heavyweight-tee',
        sku: 'TRV-TEE-BLK-L',
        price: 1499,
        stock: 20,
        image_url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=800',
        attributes: { color: 'Onyx Black', size: 'L' },
        active: true,
      },
      {
        id: 'var-tee-wht-m',
        product_id: 'prod-oversized-heavyweight-tee',
        sku: 'TRV-TEE-WHT-M',
        price: 1499,
        stock: 15,
        image_url: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&q=80&w=800',
        attributes: { color: 'Cloud White', size: 'M' },
        active: true,
      },
      {
        id: 'var-tee-nvy-l',
        product_id: 'prod-oversized-heavyweight-tee',
        sku: 'TRV-TEE-NVY-L',
        price: 1499,
        stock: 10,
        image_url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=800',
        attributes: { color: 'Sapphire Navy', size: 'L' },
        active: true,
      },
    ],
  },
  {
    id: 'prod-pima-crewneck-tee',
    name: 'Peruvian Pima Luxury Crewneck Tee',
    slug: 'peruvian-pima-luxury-crewneck-tee',
    description:
      'Crafted from silky extra-long staple Peruvian Pima cotton. Extremely soft on the skin with subtle luster, tailored shoulder seams, and tonal TRYVOAL embroidery.',
    category_id: 'cat-tshirts',
    category: FALLBACK_CATEGORIES[0],
    price: 1299,
    stock: 60,
    featured: true,
    main_image_url: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&q=80&w=800',
    additional_images: [],
    sku: 'TRV-PIMA-CRW',
    brand: 'TRYVOAL',
    material: '100% Peruvian Pima Cotton (190 GSM)',
    finish: 'Mercerized Silk Sheen',
    warranty_info: 'Premium Durability Guarantee',
    has_variants: true,
    is_new_arrival: false,
    is_active: true,
    created_at: '2026-01-02T00:00:00Z',
    variant_config: {
      enabledOptions: ['color', 'size'],
      options: [
        {
          id: 'color',
          name: 'Color',
          type: 'color',
          required: true,
          values: [
            { id: 'slate-gray', label: 'Slate Gray', colorHex: '#475569' },
            { id: 'bone-cream', label: 'Bone Cream', colorHex: '#f1f5f9' },
            { id: 'midnight-black', label: 'Midnight Black', colorHex: '#0f172a' },
          ],
        },
        {
          id: 'size',
          name: 'Size',
          type: 'button',
          required: true,
          values: ['S', 'M', 'L', 'XL', 'XXL'],
        },
      ],
    },
    variants: [
      {
        id: 'var-pima-gry-m',
        product_id: 'prod-pima-crewneck-tee',
        sku: 'TRV-PIMA-GRY-M',
        price: 1299,
        stock: 20,
        image_url: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&q=80&w=800',
        attributes: { color: 'Slate Gray', size: 'M' },
        active: true,
      },
      {
        id: 'var-pima-crm-l',
        product_id: 'prod-pima-crewneck-tee',
        sku: 'TRV-PIMA-CRM-L',
        price: 1299,
        stock: 15,
        image_url: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&q=80&w=800',
        attributes: { color: 'Bone Cream', size: 'L' },
        active: true,
      },
    ],
  },
  {
    id: 'prod-vintage-washed-tee',
    name: 'Vintage Washed Drop-Shoulder Tee',
    slug: 'vintage-washed-drop-shoulder-tee',
    description:
      'Artisan enzyme acid-washed heavy jersey tee with raw hand-feel and subtle vintage fade. Generous relaxed drape built for everyday luxury streetwear.',
    category_id: 'cat-tshirts',
    category: FALLBACK_CATEGORIES[0],
    price: 1699,
    stock: 45,
    featured: false,
    main_image_url: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&q=80&w=800',
    additional_images: [],
    sku: 'TRV-TEE-VNT',
    brand: 'TRYVOAL',
    material: '100% Combed Slub Cotton (260 GSM)',
    finish: 'Enzyme Mineral Acid Wash',
    warranty_info: 'Colorfast Fade Warranty',
    has_variants: true,
    is_new_arrival: true,
    is_active: true,
    created_at: '2026-01-03T00:00:00Z',
    variant_config: {
      enabledOptions: ['color', 'size'],
      options: [
        {
          id: 'color',
          name: 'Color',
          type: 'color',
          required: true,
          values: [
            { id: 'faded-charcoal', label: 'Faded Charcoal', colorHex: '#334155' },
            { id: 'washed-indigo', label: 'Washed Indigo', colorHex: '#1e293b' },
          ],
        },
        {
          id: 'size',
          name: 'Size',
          type: 'button',
          required: true,
          values: ['S', 'M', 'L', 'XL'],
        },
      ],
    },
    variants: [
      {
        id: 'var-vnt-chr-m',
        product_id: 'prod-vintage-washed-tee',
        sku: 'TRV-VNT-CHR-M',
        price: 1699,
        stock: 20,
        image_url: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&q=80&w=800',
        attributes: { color: 'Faded Charcoal', size: 'M' },
        active: true,
      },
    ],
  },
  {
    id: 'prod-riviera-linen-shirt',
    name: 'Riviera Relaxed French Linen Shirt',
    slug: 'riviera-relaxed-french-linen-shirt',
    description:
      'Woven from 100% pure Normandy flax linen. Features genuine mother-of-pearl buttons, a convertible camp collar, and a modern relaxed cut perfect for warm evenings.',
    category_id: 'cat-shirts',
    category: FALLBACK_CATEGORIES[1],
    price: 2799,
    stock: 40,
    featured: true,
    main_image_url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&q=80&w=800',
    additional_images: [],
    sku: 'TRV-RIV-LIN',
    brand: 'TRYVOAL',
    material: '100% Normandy Flax Linen',
    finish: 'Garment Enzyme Soft-Washed',
    warranty_info: 'Premium Fabric Guarantee',
    has_variants: true,
    is_new_arrival: true,
    is_active: true,
    created_at: '2026-01-04T00:00:00Z',
    variant_config: {
      enabledOptions: ['color', 'size'],
      options: [
        {
          id: 'color',
          name: 'Color',
          type: 'color',
          required: true,
          values: [
            { id: 'crisp-white', label: 'Crisp White', colorHex: '#ffffff' },
            { id: 'sky-blue', label: 'Sky Blue', colorHex: '#93c5fd' },
            { id: 'olive-sage', label: 'Olive Sage', colorHex: '#3f6212' },
          ],
        },
        {
          id: 'size',
          name: 'Size',
          type: 'button',
          required: true,
          values: ['S', 'M', 'L', 'XL', 'XXL'],
        },
      ],
    },
    variants: [
      {
        id: 'var-lin-wht-m',
        product_id: 'prod-riviera-linen-shirt',
        sku: 'TRV-LIN-WHT-M',
        price: 2799,
        stock: 12,
        image_url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&q=80&w=800',
        attributes: { color: 'Crisp White', size: 'M' },
        active: true,
      },
      {
        id: 'var-lin-sky-l',
        product_id: 'prod-riviera-linen-shirt',
        sku: 'TRV-LIN-SKY-L',
        price: 2799,
        stock: 10,
        image_url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&q=80&w=800',
        attributes: { color: 'Sky Blue', size: 'L' },
        active: true,
      },
    ],
  },
  {
    id: 'prod-oxford-tailored-shirt',
    name: 'Modern Oxford Tailored Button-Down',
    slug: 'modern-oxford-tailored-button-down',
    description:
      'Substantial 80s two-ply pinpoint Oxford cotton shirt. Styled with a crisp button-down collar, rear box pleat, reinforced gussets, and clean French seams.',
    category_id: 'cat-shirts',
    category: FALLBACK_CATEGORIES[1],
    price: 2499,
    stock: 50,
    featured: true,
    main_image_url: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&q=80&w=800',
    additional_images: [],
    sku: 'TRV-OXF-TLR',
    brand: 'TRYVOAL',
    material: '100% Two-Ply Pinpoint Oxford Cotton',
    finish: 'Silky Wrinkle-Resistant Handfeel',
    warranty_info: 'Craftsmanship Guarantee',
    has_variants: true,
    is_new_arrival: false,
    is_active: true,
    created_at: '2026-01-05T00:00:00Z',
    variant_config: {
      enabledOptions: ['color', 'size'],
      options: [
        {
          id: 'color',
          name: 'Color',
          type: 'color',
          required: true,
          values: [
            { id: 'classic-blue', label: 'Classic Blue', colorHex: '#2563eb' },
            { id: 'pure-white', label: 'Pure White', colorHex: '#ffffff' },
            { id: 'royal-navy', label: 'Royal Navy', colorHex: '#1e3a8a' },
          ],
        },
        {
          id: 'size',
          name: 'Size',
          type: 'button',
          required: true,
          values: ['S', 'M', 'L', 'XL', 'XXL'],
        },
      ],
    },
    variants: [
      {
        id: 'var-oxf-blu-m',
        product_id: 'prod-oxford-tailored-shirt',
        sku: 'TRV-OXF-BLU-M',
        price: 2499,
        stock: 18,
        image_url: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&q=80&w=800',
        attributes: { color: 'Classic Blue', size: 'M' },
        active: true,
      },
      {
        id: 'var-oxf-wht-l',
        product_id: 'prod-oxford-tailored-shirt',
        sku: 'TRV-OXF-WHT-L',
        price: 2499,
        stock: 15,
        image_url: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&q=80&w=800',
        attributes: { color: 'Pure White', size: 'L' },
        active: true,
      },
    ],
  },
  {
    id: 'prod-resort-camp-collar-shirt',
    name: 'Camp-Collar Silk-Touch Resort Shirt',
    slug: 'camp-collar-silk-touch-resort-shirt',
    description:
      'Ultra-breathable premium Tencel Lyocell in a vintage Cuban resort silhouette with subtle tonal jacquard weave and relaxed straight hem.',
    category_id: 'cat-shirts',
    category: FALLBACK_CATEGORIES[1],
    price: 2299,
    stock: 35,
    featured: false,
    main_image_url: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&q=80&w=800',
    additional_images: [],
    sku: 'TRV-RST-CMP',
    brand: 'TRYVOAL',
    material: '100% Sustainable Tencel Lyocell',
    finish: 'Silky Drape Soft Touch',
    warranty_info: 'Fabric Quality Guarantee',
    has_variants: true,
    is_new_arrival: true,
    is_active: true,
    created_at: '2026-01-06T00:00:00Z',
    variant_config: {
      enabledOptions: ['color', 'size'],
      options: [
        {
          id: 'color',
          name: 'Color',
          type: 'color',
          required: true,
          values: [
            { id: 'noir-black', label: 'Noir Black', colorHex: '#18181b' },
            { id: 'sapphire-blue', label: 'Sapphire Blue', colorHex: '#1e3a8a' },
          ],
        },
        {
          id: 'size',
          name: 'Size',
          type: 'button',
          required: true,
          values: ['M', 'L', 'XL'],
        },
      ],
    },
    variants: [
      {
        id: 'var-rst-blk-l',
        product_id: 'prod-resort-camp-collar-shirt',
        sku: 'TRV-RST-BLK-L',
        price: 2299,
        stock: 12,
        image_url: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&q=80&w=800',
        attributes: { color: 'Noir Black', size: 'L' },
        active: true,
      },
    ],
  },
  {
    id: 'prod-full-grain-cardholder',
    name: 'Full-Grain Italian Leather Cardholder',
    slug: 'full-grain-italian-leather-cardholder',
    description:
      'Hand-crafted vegetable-tanned full grain Tuscan leather. Features 6 card slots, a central cash pocket, hand-painted edges, and blind embossed TRYVOAL insignia.',
    category_id: 'cat-accessories',
    category: FALLBACK_CATEGORIES[2],
    price: 999,
    stock: 50,
    featured: true,
    main_image_url: 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&q=80&w=800',
    additional_images: [],
    sku: 'TRV-ACC-CRD',
    brand: 'TRYVOAL',
    material: '100% Full-Grain Vegetable Tanned Italian Leather',
    finish: 'Hand-Burnished Waxed Edge',
    warranty_info: '5-Year Leather Patina Guarantee',
    has_variants: true,
    is_new_arrival: false,
    is_active: true,
    created_at: '2026-01-07T00:00:00Z',
    variant_config: {
      enabledOptions: ['color'],
      options: [
        {
          id: 'color',
          name: 'Color',
          type: 'color',
          required: true,
          values: [
            { id: 'saddle-tan', label: 'Saddle Tan', colorHex: '#78350f' },
            { id: 'onyx-black', label: 'Onyx Black', colorHex: '#18181b' },
            { id: 'sapphire-navy', label: 'Sapphire Navy', colorHex: '#1e3a8a' },
          ],
        },
      ],
    },
    variants: [
      {
        id: 'var-crd-tan',
        product_id: 'prod-full-grain-cardholder',
        sku: 'TRV-CRD-TAN',
        price: 999,
        stock: 20,
        image_url: 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&q=80&w=800',
        attributes: { color: 'Saddle Tan' },
        active: true,
      },
      {
        id: 'var-crd-blk',
        product_id: 'prod-full-grain-cardholder',
        sku: 'TRV-CRD-BLK',
        price: 999,
        stock: 20,
        image_url: 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&q=80&w=800',
        attributes: { color: 'Onyx Black' },
        active: true,
      },
    ],
  },
  {
    id: 'prod-heavy-canvas-tote',
    name: 'Architectural Heavy Canvas Tote',
    slug: 'architectural-heavy-canvas-tote',
    description:
      'Engineered from heavy 16oz cotton duck canvas with reinforced cross-box stitched handles, internal zippered compartment, and water-repellent coating.',
    category_id: 'cat-accessories',
    category: FALLBACK_CATEGORIES[2],
    price: 1199,
    stock: 40,
    featured: false,
    main_image_url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=800',
    additional_images: [],
    sku: 'TRV-ACC-TOT',
    brand: 'TRYVOAL',
    material: '16oz Heavy Cotton Duck Canvas',
    finish: 'DWR Water-Resistant Coating',
    warranty_info: '2-Year Hardware & Seam Warranty',
    has_variants: true,
    is_new_arrival: true,
    is_active: true,
    created_at: '2026-01-08T00:00:00Z',
    variant_config: {
      enabledOptions: ['color'],
      options: [
        {
          id: 'color',
          name: 'Color',
          type: 'color',
          required: true,
          values: [
            { id: 'natural-ecru', label: 'Natural Ecru', colorHex: '#fef3c7' },
            { id: 'deep-black', label: 'Deep Black', colorHex: '#18181b' },
          ],
        },
      ],
    },
    variants: [
      {
        id: 'var-tot-ecr',
        product_id: 'prod-heavy-canvas-tote',
        sku: 'TRV-TOT-ECR',
        price: 1199,
        stock: 25,
        image_url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=800',
        attributes: { color: 'Natural Ecru' },
        active: true,
      },
    ],
  },
  {
    id: 'prod-monogram-dad-cap',
    name: 'Embroidered Monogram Dad Cap',
    slug: 'embroidered-monogram-dad-cap',
    description:
      'Classic 6-panel unstructured low-profile baseball cap made from washed cotton chino twill. Featuring antique brass tri-glide buckle and high-density TRYVOAL embroidery.',
    category_id: 'cat-accessories',
    category: FALLBACK_CATEGORIES[2],
    price: 799,
    stock: 60,
    featured: false,
    main_image_url: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&q=80&w=800',
    additional_images: [],
    sku: 'TRV-ACC-CAP',
    brand: 'TRYVOAL',
    material: '100% Chino Cotton Twill',
    finish: 'Pigment Washed',
    warranty_info: 'Shape Retention Guarantee',
    has_variants: true,
    is_new_arrival: false,
    is_active: true,
    created_at: '2026-01-09T00:00:00Z',
    variant_config: {
      enabledOptions: ['color'],
      options: [
        {
          id: 'color',
          name: 'Color',
          type: 'color',
          required: true,
          values: [
            { id: 'midnight-black', label: 'Midnight Black', colorHex: '#18181b' },
            { id: 'sapphire-navy', label: 'Sapphire Navy', colorHex: '#1e3a8a' },
            { id: 'stone-beige', label: 'Stone Beige', colorHex: '#d6d3d1' },
          ],
        },
      ],
    },
    variants: [
      {
        id: 'var-cap-blk',
        product_id: 'prod-monogram-dad-cap',
        sku: 'TRV-CAP-BLK',
        price: 799,
        stock: 30,
        image_url: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&q=80&w=800',
        attributes: { color: 'Midnight Black' },
        active: true,
      },
    ],
  },
];

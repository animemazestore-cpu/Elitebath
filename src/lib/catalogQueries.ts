import { sanitizeSlug } from './persistence';
import type { Category, Product, ProductVariant, ProductVariantConfig } from '../types/database';

export const CATEGORY_FIELDS = 'id, name, image_url, created_at';

export const PRODUCT_VARIANT_FIELDS =
  'id, product_id, sku, price, stock, image_url, attributes, active, created_at, updated_at';

export const PRODUCT_LIST_FIELDS =
  'id, name, slug, description, category_id, price, stock, featured, main_image_url, sku, brand, material, finish, warranty_info, has_variants, variant_config, is_new_arrival, is_active, shipping_fee, created_at';

export const PRODUCT_DETAIL_FIELDS =
  'id, name, slug, description, category_id, price, stock, featured, main_image_url, additional_images, sku, brand, material, finish, warranty_info, has_variants, variant_config, is_new_arrival, is_active, shipping_fee, created_at';

export const PRODUCT_RELATED_FIELDS =
  'id, name, slug, price, stock, featured, main_image_url, sku, brand, finish, has_variants, created_at';

export const PRODUCT_LIST_SELECT = `
  ${PRODUCT_LIST_FIELDS},
  category:categories (${CATEGORY_FIELDS}),
  variants:product_variants (${PRODUCT_VARIANT_FIELDS})
`;

export const PRODUCT_DETAIL_SELECT = `
  ${PRODUCT_DETAIL_FIELDS},
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
    brand: (raw.brand as string | null) ?? 'Elite Bath',
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
// Fallback Luxury Sanitaryware Catalog (Guarantees immediate zero-downtime render)
// ============================================================================

export const FALLBACK_CATEGORIES: Category[] = [
  {
    id: 'cat-faucets',
    name: 'Faucets & Taps',
    image_url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=600',
    size_enabled: false,
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'cat-showers',
    name: 'Showers & Systems',
    image_url: 'https://images.unsplash.com/photo-1584622781564-1d987f7333c1?auto=format&fit=crop&q=80&w=600',
    size_enabled: false,
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'cat-basins',
    name: 'Wash Basins',
    image_url: 'https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&q=80&w=600',
    size_enabled: false,
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'cat-toilets',
    name: 'Toilets & Commodes',
    image_url: 'https://images.unsplash.com/photo-1564540586988-aa4e53c3d799?auto=format&fit=crop&q=80&w=600',
    size_enabled: false,
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'cat-bathtubs',
    name: 'Bathtubs & Jacuzzis',
    image_url: 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&q=80&w=600',
    size_enabled: false,
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'cat-vanity',
    name: 'Bathroom Vanity & Cabinets',
    image_url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=600',
    size_enabled: false,
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'cat-accessories',
    name: 'Bathroom Accessories',
    image_url: 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&q=80&w=600',
    size_enabled: false,
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'cat-drains',
    name: 'Drains & Waste Fittings',
    image_url: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&q=80&w=600',
    size_enabled: false,
    created_at: '2026-01-01T00:00:00Z',
  },
];

export const FALLBACK_PRODUCTS: Product[] = [
  {
    id: 'prod-aura-basin-mixer',
    name: 'Aura Wall-Mounted Luxury Basin Mixer',
    slug: 'aura-wall-mounted-luxury-basin-mixer',
    description:
      'Precision-engineered architectural basin mixer forged from solid brass with high-flow ceramic disc cartridge. Minimalist aerator delivers a splash-free, silky laminar stream.',
    category_id: 'cat-faucets',
    category: FALLBACK_CATEGORIES[0],
    price: 3499,
    stock: 45,
    featured: true,
    main_image_url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=800',
    additional_images: [
      'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&q=80&w=800',
    ],
    sku: 'EBC-AURA-BASE',
    brand: 'Elite Bath Collections',
    material: 'Forged Solid Brass',
    finish: 'Multi-Finish Options',
    warranty_info: '10-Year Anti-Tarnish Warranty',
    has_variants: true,
    is_new_arrival: true,
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    variant_config: {
      enabledOptions: ['color', 'finish'],
      options: [
        {
          id: 'color',
          name: 'Color',
          type: 'color',
          required: true,
          values: [
            { id: 'matte-black', label: 'Matte Black', colorHex: '#18181b' },
            { id: 'brushed-gold', label: 'Brushed Gold', colorHex: '#d4af37' },
            { id: 'chrome', label: 'Polished Chrome', colorHex: '#cbd5e1' },
          ],
        },
        {
          id: 'finish',
          name: 'Surface Finish',
          type: 'button',
          required: true,
          values: ['Matte', 'Brushed', 'Mirror Gloss'],
        },
      ],
    },
    variants: [
      {
        id: 'var-aura-mb-matte',
        product_id: 'prod-aura-basin-mixer',
        sku: 'EBC-AURA-MB-MAT',
        price: 3899,
        stock: 15,
        image_url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=800',
        attributes: { color: 'Matte Black', finish: 'Matte' },
        active: true,
      },
      {
        id: 'var-aura-bg-brushed',
        product_id: 'prod-aura-basin-mixer',
        sku: 'EBC-AURA-BG-BRU',
        price: 4499,
        stock: 10,
        image_url: 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&q=80&w=800',
        attributes: { color: 'Brushed Gold', finish: 'Brushed' },
        active: true,
      },
      {
        id: 'var-aura-cr-gloss',
        product_id: 'prod-aura-basin-mixer',
        sku: 'EBC-AURA-CR-GLO',
        price: 3499,
        stock: 20,
        image_url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=800',
        attributes: { color: 'Polished Chrome', finish: 'Mirror Gloss' },
        active: true,
      },
    ],
  },
  {
    id: 'prod-cascade-shower-system',
    name: 'Cascade Thermostatic Rain Shower System',
    slug: 'cascade-thermostatic-rain-shower-system',
    description:
      'Ultra-luxury concealed thermostatic shower column featuring an ultra-slim overhead rain plate, anti-scald smart cartridge (38°C safety stop), and precision brass handheld jet spray.',
    category_id: 'cat-showers',
    category: FALLBACK_CATEGORIES[1],
    price: 8999,
    stock: 35,
    featured: true,
    main_image_url: 'https://images.unsplash.com/photo-1584622781564-1d987f7333c1?auto=format&fit=crop&q=80&w=800',
    additional_images: [
      'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&q=80&w=800',
    ],
    sku: 'EBC-SHW-CASCADE',
    brand: 'Elite Bath Collections',
    material: 'SUS304 Stainless Steel & DZR Brass',
    finish: 'PVD Coated',
    warranty_info: '7-Year Comprehensive Warranty',
    has_variants: true,
    is_new_arrival: true,
    is_active: true,
    created_at: '2026-01-02T00:00:00Z',
    variant_config: {
      enabledOptions: ['color', 'model'],
      options: [
        {
          id: 'color',
          name: 'Color',
          type: 'color',
          required: true,
          values: [
            { id: 'matte-black', label: 'Matte Black', colorHex: '#18181b' },
            { id: 'brushed-gold', label: 'Brushed Gold', colorHex: '#d4af37' },
          ],
        },
        {
          id: 'model',
          name: 'Shower Head Size',
          type: 'button',
          required: true,
          values: ['10-Inch Slim Plate', '12-Inch Waterfall Plate'],
        },
      ],
    },
    variants: [
      {
        id: 'var-casc-mb-10',
        product_id: 'prod-cascade-shower-system',
        sku: 'EBC-SHW-MB-10',
        price: 8999,
        stock: 12,
        image_url: 'https://images.unsplash.com/photo-1584622781564-1d987f7333c1?auto=format&fit=crop&q=80&w=800',
        attributes: { color: 'Matte Black', model: '10-Inch Slim Plate' },
        active: true,
      },
      {
        id: 'var-casc-mb-12',
        product_id: 'prod-cascade-shower-system',
        sku: 'EBC-SHW-MB-12',
        price: 10499,
        stock: 8,
        image_url: 'https://images.unsplash.com/photo-1584622781564-1d987f7333c1?auto=format&fit=crop&q=80&w=800',
        attributes: { color: 'Matte Black', model: '12-Inch Waterfall Plate' },
        active: true,
      },
      {
        id: 'var-casc-bg-10',
        product_id: 'prod-cascade-shower-system',
        sku: 'EBC-SHW-BG-10',
        price: 10999,
        stock: 9,
        image_url: 'https://images.unsplash.com/photo-1584622781564-1d987f7333c1?auto=format&fit=crop&q=80&w=800',
        attributes: { color: 'Brushed Gold', model: '10-Inch Slim Plate' },
        active: true,
      },
      {
        id: 'var-casc-bg-12',
        product_id: 'prod-cascade-shower-system',
        sku: 'EBC-SHW-BG-12',
        price: 12499,
        stock: 6,
        image_url: 'https://images.unsplash.com/photo-1584622781564-1d987f7333c1?auto=format&fit=crop&q=80&w=800',
        attributes: { color: 'Brushed Gold', model: '12-Inch Waterfall Plate' },
        active: true,
      },
    ],
  },
  {
    id: 'prod-vertex-wall-hung-toilet',
    name: 'Vertex Rimless Wall-Hung Smart Toilet',
    slug: 'vertex-rimless-wall-hung-smart-toilet',
    description:
      'Aerodynamic rimless vitreous china commode with dual-whirlpool tornado flushing technology. Features ultra-slim soft-close UF seat cover and anti-bacterial glaze coating.',
    category_id: 'cat-toilets',
    category: FALLBACK_CATEGORIES[3],
    price: 12499,
    stock: 24,
    featured: true,
    main_image_url: 'https://images.unsplash.com/photo-1564540586988-aa4e53c3d799?auto=format&fit=crop&q=80&w=800',
    additional_images: [],
    sku: 'EBC-VTX-BASE',
    brand: 'Elite Bath Collections',
    material: 'High-Density Vitreous China',
    finish: 'Nano Anti-Bacterial Glaze',
    warranty_info: '12-Year Ceramic Warranty',
    has_variants: true,
    is_new_arrival: false,
    is_active: true,
    created_at: '2026-01-03T00:00:00Z',
    variant_config: {
      enabledOptions: ['color'],
      options: [
        {
          id: 'color',
          name: 'Color',
          type: 'color',
          required: true,
          values: [
            { id: 'alpine-white', label: 'Alpine White', colorHex: '#ffffff' },
            { id: 'matte-black', label: 'Matte Charcoal Black', colorHex: '#18181b' },
          ],
        },
      ],
    },
    variants: [
      {
        id: 'var-vtx-wh',
        product_id: 'prod-vertex-wall-hung-toilet',
        sku: 'EBC-VTX-WH',
        price: 12499,
        stock: 18,
        image_url: 'https://images.unsplash.com/photo-1564540586988-aa4e53c3d799?auto=format&fit=crop&q=80&w=800',
        attributes: { color: 'Alpine White' },
        active: true,
      },
      {
        id: 'var-vtx-mb',
        product_id: 'prod-vertex-wall-hung-toilet',
        sku: 'EBC-VTX-MB',
        price: 15999,
        stock: 6,
        image_url: 'https://images.unsplash.com/photo-1564540586988-aa4e53c3d799?auto=format&fit=crop&q=80&w=800',
        attributes: { color: 'Matte Charcoal Black' },
        active: true,
      },
    ],
  },
  {
    id: 'prod-zenith-freestanding-bathtub',
    name: 'Zenith Freestanding Ergonomic Bathtub',
    slug: 'zenith-freestanding-ergonomic-bathtub',
    description:
      'Seamless double-walled acrylic soaking tub designed for posture support. Incorporates thermal insulation layers to retain bath warmth up to 60 minutes longer.',
    category_id: 'cat-bathtubs',
    category: FALLBACK_CATEGORIES[4],
    price: 38999,
    stock: 14,
    featured: true,
    main_image_url: 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&q=80&w=800',
    additional_images: [],
    sku: 'EBC-ZNT-TUB',
    brand: 'Elite Bath Collections',
    material: 'Reinforced Sanitary-Grade Acrylic',
    finish: 'UV-Stabilized High Polish',
    warranty_info: '10-Year Shell Warranty',
    has_variants: true,
    is_new_arrival: true,
    is_active: true,
    created_at: '2026-01-04T00:00:00Z',
    variant_config: {
      enabledOptions: ['size', 'color'],
      options: [
        {
          id: 'size',
          name: 'Dimensions',
          type: 'button',
          required: true,
          values: ['1500 x 750 x 580 mm', '1700 x 800 x 600 mm'],
        },
        {
          id: 'color',
          name: 'Finish Accent',
          type: 'color',
          required: true,
          values: [
            { id: 'pure-white', label: 'Pure Glossy White', colorHex: '#ffffff' },
            { id: 'dual-tone', label: 'Dual Tone (Black Outer / White Inner)', colorHex: '#27272a' },
          ],
        },
      ],
    },
    variants: [
      {
        id: 'var-znt-150-wh',
        product_id: 'prod-zenith-freestanding-bathtub',
        sku: 'EBC-ZNT-150-WH',
        price: 38999,
        stock: 5,
        image_url: 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&q=80&w=800',
        attributes: { size: '1500 x 750 x 580 mm', color: 'Pure Glossy White' },
        active: true,
      },
      {
        id: 'var-znt-170-wh',
        product_id: 'prod-zenith-freestanding-bathtub',
        sku: 'EBC-ZNT-170-WH',
        price: 44999,
        stock: 6,
        image_url: 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&q=80&w=800',
        attributes: { size: '1700 x 800 x 600 mm', color: 'Pure Glossy White' },
        active: true,
      },
      {
        id: 'var-znt-170-dt',
        product_id: 'prod-zenith-freestanding-bathtub',
        sku: 'EBC-ZNT-170-DT',
        price: 48999,
        stock: 3,
        image_url: 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&q=80&w=800',
        attributes: { size: '1700 x 800 x 600 mm', color: 'Dual Tone (Black Outer / White Inner)' },
        active: true,
      },
    ],
  },
  {
    id: 'prod-luna-oval-vessel-basin',
    name: 'Luna Fluted Oval Ceramic Vessel Basin',
    slug: 'luna-fluted-oval-ceramic-vessel-basin',
    description:
      'Artisanal countertop wash basin featuring vertical fluted ribbed exterior walls. Fired at 1280°C for exceptional strength, scratch resistance, and low water absorption.',
    category_id: 'cat-basins',
    category: FALLBACK_CATEGORIES[2],
    price: 4899,
    stock: 38,
    featured: true,
    main_image_url: 'https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&q=80&w=800',
    additional_images: [],
    sku: 'EBC-LUN-BASIN',
    brand: 'Elite Bath Collections',
    material: 'Vitreous Ceramic',
    finish: 'Silky Matte Glaze',
    warranty_info: '5-Year Glaze Warranty',
    has_variants: true,
    is_new_arrival: false,
    is_active: true,
    created_at: '2026-01-05T00:00:00Z',
    variant_config: {
      enabledOptions: ['color'],
      options: [
        {
          id: 'color',
          name: 'Color',
          type: 'color',
          required: true,
          values: [
            { id: 'matte-white', label: 'Matte White', colorHex: '#f8fafc' },
            { id: 'matte-black', label: 'Matte Black', colorHex: '#18181b' },
            { id: 'emerald-green', label: 'Emerald Sage', colorHex: '#065f46' },
          ],
        },
      ],
    },
    variants: [
      {
        id: 'var-lun-mw',
        product_id: 'prod-luna-oval-vessel-basin',
        sku: 'EBC-LUN-MW',
        price: 4899,
        stock: 20,
        image_url: 'https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&q=80&w=800',
        attributes: { color: 'Matte White' },
        active: true,
      },
      {
        id: 'var-lun-mb',
        product_id: 'prod-luna-oval-vessel-basin',
        sku: 'EBC-LUN-MB',
        price: 5299,
        stock: 10,
        image_url: 'https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&q=80&w=800',
        attributes: { color: 'Matte Black' },
        active: true,
      },
      {
        id: 'var-lun-em',
        product_id: 'prod-luna-oval-vessel-basin',
        sku: 'EBC-LUN-EM',
        price: 5699,
        stock: 8,
        image_url: 'https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&q=80&w=800',
        attributes: { color: 'Emerald Sage' },
        active: true,
      },
    ],
  },
  {
    id: 'prod-linear-floor-drain',
    name: 'Architectural Stainless Steel Linear Floor Drain',
    slug: 'architectural-stainless-steel-linear-floor-drain',
    description:
      'Heavy-gauge stainless steel 304 linear trench shower drain with dual-sided reversible grate (tile-insert or satin brushed) and integrated hair strainer / anti-odor silicone trap.',
    category_id: 'cat-drains',
    category: FALLBACK_CATEGORIES[7],
    price: 1699,
    stock: 65,
    featured: false,
    main_image_url: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&q=80&w=800',
    additional_images: [],
    sku: 'EBC-DRN-BASE',
    brand: 'Elite Bath Collections',
    material: 'SUS304 Surgical Grade Stainless Steel',
    finish: 'Brushed & Electroplated',
    warranty_info: '5-Year Anti-Rust Warranty',
    has_variants: true,
    is_new_arrival: false,
    is_active: true,
    created_at: '2026-01-06T00:00:00Z',
    variant_config: {
      enabledOptions: ['size', 'finish'],
      options: [
        {
          id: 'size',
          name: 'Trench Length',
          type: 'button',
          required: true,
          values: ['600 mm', '900 mm', '1200 mm'],
        },
        {
          id: 'finish',
          name: 'Finish',
          type: 'button',
          required: true,
          values: ['Satin Brushed Steel', 'Matte Black PVD'],
        },
      ],
    },
    variants: [
      {
        id: 'var-drn-60-bs',
        product_id: 'prod-linear-floor-drain',
        sku: 'EBC-DRN-60-BS',
        price: 1699,
        stock: 30,
        image_url: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&q=80&w=800',
        attributes: { size: '600 mm', finish: 'Satin Brushed Steel' },
        active: true,
      },
      {
        id: 'var-drn-60-mb',
        product_id: 'prod-linear-floor-drain',
        sku: 'EBC-DRN-60-MB',
        price: 1899,
        stock: 20,
        image_url: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&q=80&w=800',
        attributes: { size: '600 mm', finish: 'Matte Black PVD' },
        active: true,
      },
      {
        id: 'var-drn-90-bs',
        product_id: 'prod-linear-floor-drain',
        sku: 'EBC-DRN-90-BS',
        price: 2299,
        stock: 15,
        image_url: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&q=80&w=800',
        attributes: { size: '900 mm', finish: 'Satin Brushed Steel' },
        active: true,
      },
    ],
  },
];

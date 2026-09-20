import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useCatalogStore } from '../store/useCatalogStore';
import { supabase } from '../lib/supabase';
import type { Product, Category, Order, ProductQuestion, Review, NewsletterSubscriber, ReplacementRequest } from '../types/database';
import { sanitizeSlug } from '../lib/persistence';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { ShieldCheck, Plus, Edit, Trash2, Check, X, CreditCard, ShoppingBag, List, MessageSquare, Star, Mail, Download, RefreshCcw, Tag, Megaphone, Calendar, Copy, MapPin, Menu, AlertTriangle, Search, Sliders, X as CloseIcon, Truck, Printer, QrCode, Package, Clock, ExternalLink, CheckCircle2 } from 'lucide-react';
import { ProductVariantEditor } from '../components/admin/ProductVariantEditor';
import type { OptionDraft, VariantDraft } from '../components/admin/ProductVariantEditor';
import { ImageUploadZone } from '../components/admin/ImageUploadZone';
import { FALLBACK_CATEGORIES, FALLBACK_PRODUCTS } from '../lib/catalogQueries';

export const Admin: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile, initialized } = useAuthStore();

  // Tabs
  const [activeTab, setActiveTab] = useState<'verification' | 'products' | 'categories' | 'orders' | 'inventory' | 'questions' | 'reviews' | 'subscribers' | 'replacements' | 'coupons' | 'announcement'>('verification');
  
  // Mobile drawer state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Database Data States
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [questions, setQuestions] = useState<ProductQuestion[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [replacementRequests, setReplacementRequests] = useState<ReplacementRequest[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [submittingProduct, setSubmittingProduct] = useState(false);
  const [submittingCategory, setSubmittingCategory] = useState(false);

  // Forms / Modals States
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    slug: '',
    description: '',
    price: 0,
    stock: 0,
    featured: false,
    category_id: '',
    main_image_url: '',
    additional_images: '',
    sku: '',
    brand: 'Elite Bath Collections',
    material: '',
    finish: '',
    warranty_info: '',
    is_new_arrival: false,
    is_active: true,
  });

  // Variant States
  const [hasVariants, setHasVariants] = useState(false);
  const [optionDrafts, setOptionDrafts] = useState<OptionDraft[]>([]);
  const [variantDrafts, setVariantDrafts] = useState<VariantDraft[]>([]);
  const [productSearchQuery, setProductSearchQuery] = useState('');

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    image_url: '',
    size_enabled: false
  });


  // Tracking Modal States
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
  const [trackingOrderId, setTrackingOrderId] = useState('');
  const [trackingCarrier, setTrackingCarrier] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingTargetStatus, setTrackingTargetStatus] = useState('');

  // Delivery Date Edit States
  const [editingDeliveryDateOrderId, setEditingDeliveryDateOrderId] = useState<string | null>(null);
  const [editingDeliveryDate, setEditingDeliveryDate] = useState('');

  // Coupon Management States
  const [coupons, setCoupons] = useState<any[]>([]);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<any>(null);
  const [couponForm, setCouponForm] = useState({ code: '', type: 'PERCENT' as 'PERCENT' | 'FIXED', value: 0, minOrder: 0, active: true });

  // Announcement State
  const [announcementText, setAnnouncementText] = useState('✨ Exclusive Offer: Use code ELITE10 for 10% discount! 🚚 FREE Shipping on sanitaryware above ₹999!');

  // Order Management Filter & Modal States
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL');
  const [orderPaymentFilter, setOrderPaymentFilter] = useState('ALL');
  const [selectedPackingSlipOrder, setSelectedPackingSlipOrder] = useState<Order | null>(null);

  // Copy Helpers
  const handleCopyText = (text: string, label: string = 'Text') => {
    navigator.clipboard.writeText(text).then(() => {
      alert(`${label} copied to clipboard!`);
    }).catch(() => {
      alert(`Failed to copy ${label.toLowerCase()}`);
    });
  };

  // Copy Address Function
  const handleCopyAddress = (order: Order) => {
    const addr = order.shipping_address;
    const addressText = [
      addr.fullName,
      addr.phone,
      addr.email,
      addr.address,
      addr.landmark,
      addr.city,
      addr.state,
      addr.pincode,
      addr.country
    ].filter(Boolean).join(', ');
    
    handleCopyText(addressText, 'Address');
  };

  // Verification checks for admin role
  useEffect(() => {
    if (initialized) {
      if (!user) {
        navigate('/auth');
      } else if (profile && profile.role !== 'admin') {
        navigate('/');
      } else {
        loadAdminData();
        loadReplacementsData();
        loadAnnouncement();
      }
    }
  }, [user, profile, initialized, navigate]);

  // --- Coupon Management ---
  const loadCoupons = useCallback(async () => {
    try {
      const { data: dbCoupons, error } = await supabase.from('coupons').select('*').order('created_at', { ascending: true });
      if (error) throw error;
      const mappedCoupons = dbCoupons ? dbCoupons.map((c: any) => ({
        id: c.id,
        code: c.code,
        type: c.discount_type || c.type,
        value: Number(c.discount_value !== undefined ? c.discount_value : c.value),
        minOrder: Number(c.min_order_amount !== undefined ? c.min_order_amount : c.min_order),
        active: c.active,
        created_at: c.created_at
      })) : [];
      setCoupons(mappedCoupons);
    } catch (err) {
      console.warn('Failed to load coupons from DB:', err);
      setCoupons([]);
    }
  }, []);

  // Fetch / sync replacement requests from database
  const loadReplacementsData = useCallback(async () => {
    try {
      const { data: dbReplacements } = await supabase
        .from('replacement_requests')
        .select('*')
        .order('created_at', { ascending: false });
      
      setReplacementRequests(dbReplacements || []);
    } catch (err) {
      console.warn('Failed to fetch replacement requests from database:', err);
      setReplacementRequests([]);
    }
  }, []);

  // Load Data
  const loadAdminData = async () => {
    setLoadingData(true);

    try {
      // 1. Fetch categories
      try {
        const { data: dbCats } = await supabase.from('categories').select('*').order('name');
        const customCats: Category[] = typeof window !== 'undefined'
          ? JSON.parse(localStorage.getItem('elitebath_custom_categories') || '[]')
          : [];
        const mergedCats = [...customCats];
        if (dbCats && dbCats.length > 0) {
          for (const c of dbCats) {
            if (!mergedCats.some((m) => m.id === c.id || m.name.toLowerCase() === c.name.toLowerCase())) {
              mergedCats.push(c);
            }
          }
        }
        for (const fb of FALLBACK_CATEGORIES) {
          if (!mergedCats.some((m) => m.id === fb.id || m.name.toLowerCase() === fb.name.toLowerCase())) {
            mergedCats.push(fb);
          }
        }
        setCategories(mergedCats);
      } catch (err) {
        console.error('Error loading categories:', err);
        const customCats: Category[] = typeof window !== 'undefined'
          ? JSON.parse(localStorage.getItem('elitebath_custom_categories') || '[]')
          : [];
        const mergedCats = [...customCats];
        for (const fb of FALLBACK_CATEGORIES) {
          if (!mergedCats.some((m) => m.id === fb.id || m.name.toLowerCase() === fb.name.toLowerCase())) {
            mergedCats.push(fb);
          }
        }
        setCategories(mergedCats);
      }

      // 2. Fetch products with variants
      try {
        const { data: dbProds } = await supabase
          .from('products')
          .select('*, category:categories(*), variants:product_variants(*)')
          .order('created_at', { ascending: false });

        const customProds: Product[] = typeof window !== 'undefined'
          ? JSON.parse(localStorage.getItem('elitebath_custom_products') || '[]')
          : [];
        const mergedProds: Product[] = [...customProds];

        if (dbProds && dbProds.length > 0) {
          const parsedProds = dbProds.map((p: any) => ({
            ...p,
            price: Number(p.price),
            slug: sanitizeSlug(p.slug, p.name)
          }));
          for (const p of parsedProds) {
            if (!mergedProds.some((m) => m.id === p.id || m.slug === p.slug)) {
              mergedProds.push(p);
            }
          }
        }
        for (const fb of FALLBACK_PRODUCTS) {
          if (!mergedProds.some((m) => m.id === fb.id || m.slug === fb.slug)) {
            mergedProds.push(fb);
          }
        }
        setProducts(mergedProds);
      } catch (err) {
        console.error('Error loading products:', err);
        const customProds: Product[] = typeof window !== 'undefined'
          ? JSON.parse(localStorage.getItem('elitebath_custom_products') || '[]')
          : [];
        const mergedProds: Product[] = [...customProds];
        for (const fb of FALLBACK_PRODUCTS) {
          if (!mergedProds.some((m) => m.id === fb.id || m.slug === fb.slug)) {
            mergedProds.push(fb);
          }
        }
        setProducts(mergedProds);
      }

      // 3. Fetch orders (merge Supabase DB orders with local resilience orders)
      try {
        let dbOrdersList: any[] = [];
        try {
          const { data: dbOrders } = await supabase.from('orders').select(`
            *,
            payment_proof:payment_proof (screenshot_url),
            items:order_items (
              *,
              product:products (*)
            )
          `).order('created_at', { ascending: false });
          if (dbOrders) dbOrdersList = dbOrders;
        } catch (dbErr) {
          console.warn('Could not fetch DB orders:', dbErr);
        }

        // Map the selected variant from shipping_address JSON and convert payment proof array to object
        const ordersWithVariantsMapped = dbOrdersList.map((order: any) => {
          const itemVariants = order.shipping_address?.item_variants || [];
          const proof = Array.isArray(order.payment_proof)
            ? order.payment_proof[0]
            : order.payment_proof;
          return {
            ...order,
            payment_proof: proof || null,
            items: order.items?.map((item: any) => {
              const matchedVariant = itemVariants.find((iv: any) => iv.product_id === item.product_id);
              return {
                ...item,
                selected_variant: item.selected_variant || matchedVariant?.selected_variant || null
              };
            })
          };
        });

        // Read local offline/resilience orders from localStorage
        let localOrders: any[] = [];
        try {
          const raw = localStorage.getItem('elitebath_local_orders') || localStorage.getItem('animemaze_local_orders');
          if (raw) {
            localOrders = JSON.parse(raw);
          }
        } catch (e) {
          console.warn('Error reading local orders:', e);
        }

        const existingDbIds = new Set(ordersWithVariantsMapped.map((o: any) => o.id));
        const normalizedLocalOrders = localOrders
          .filter((lo: any) => !existingDbIds.has(lo.id))
          .map((lo: any) => ({
            ...lo,
            items: (lo.items || []).map((it: any) => ({
              ...it,
              product: it.product || {
                name: it.product_name || 'Sanitaryware Item',
                main_image_url: it.image_url || '/placeholder.jpg',
                sku: it.sku || (it.selected_variant_id ? `EBC-${it.selected_variant_id.slice(0, 8).toUpperCase()}` : null),
                price: it.price || 0
              }
            }))
          }));

        const mergedOrders = [...ordersWithVariantsMapped, ...normalizedLocalOrders].sort((a: any, b: any) => {
          const timeA = new Date(a.created_at || 0).getTime();
          const timeB = new Date(b.created_at || 0).getTime();
          return timeB - timeA;
        });

        setOrders(mergedOrders as Order[]);
      } catch (err) {
        console.error('Error loading orders:', err);
        try {
          const raw = localStorage.getItem('elitebath_local_orders') || localStorage.getItem('animemaze_local_orders');
          if (raw) {
            const parsed = JSON.parse(raw);
            const normalized = parsed.map((lo: any) => ({
              ...lo,
              items: (lo.items || []).map((it: any) => ({
                ...it,
                product: it.product || {
                  name: it.product_name || 'Sanitaryware Item',
                  main_image_url: it.image_url || '/placeholder.jpg',
                  sku: it.sku || null,
                  price: it.price || 0
                }
              }))
            }));
            setOrders(normalized as Order[]);
          } else {
            setOrders([]);
          }
        } catch {
          setOrders([]);
        }
      }

      // 4. Fetch questions
      try {
        const { data: dbQuestions, error: qnaError } = await supabase.from('product_questions').select('*').order('created_at', { ascending: false });
        if (qnaError) throw qnaError;
        setQuestions(dbQuestions as ProductQuestion[] || []);
      } catch (err) {
        console.error('Error loading questions:', err);
        setQuestions([]);
      }

      // 5. Fetch reviews
      try {
        const { data: dbReviews, error: revError } = await supabase.from('reviews').select('*').order('created_at', { ascending: false });
        if (revError) throw revError;
        setReviews(dbReviews as Review[] || []);
      } catch (err) {
        console.error('Error loading reviews:', err);
        setReviews([]);
      }

      // 6. Fetch subscribers
      try {
        const { data: dbSubs } = await supabase.from('newsletter_subscribers').select('*').order('created_at', { ascending: false });
        if (dbSubs) setSubscribers(dbSubs as NewsletterSubscriber[]);
      } catch (err) {
        console.error('Error loading subscribers:', err);
      }

      // 7. Fetch replacement requests
      await loadReplacementsData();

      // Load coupons
      loadCoupons();

      // Load announcement
      loadAnnouncement();

    } catch (err) {
      console.error('Error loading admin dashboard details:', err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (user && profile?.role === 'admin') {
      loadAdminData();
    }
  }, [user, profile]);

  // Auto-refresh replacement requests when on the replacements tab
  useEffect(() => {
    if (activeTab !== 'replacements') return;
    loadReplacementsData(); // immediate refresh on tab switch
    const interval = setInterval(loadReplacementsData, 3000);
    return () => clearInterval(interval);
  }, [activeTab, loadReplacementsData]);

  const handleCouponSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = couponForm.code.trim().toUpperCase();
    if (!code) return;
    
    try {
      if (editingCoupon) {
        // Update in DB
        const { error } = await supabase
          .from('coupons')
          .update({ 
            code, 
            discount_type: couponForm.type, 
            discount_value: couponForm.value, 
            min_order_amount: couponForm.minOrder, 
            active: couponForm.active 
          })
          .eq('code', editingCoupon.code);
        if (error) throw error;
      } else {
        // Check duplicate
        if (coupons.some(c => c.code === code)) {
          alert('Coupon code already exists!');
          return;
        }
        // Insert in DB
        const { error } = await supabase
          .from('coupons')
          .insert({ 
            code, 
            discount_type: couponForm.type, 
            discount_value: couponForm.value, 
            min_order_amount: couponForm.minOrder, 
            active: couponForm.active 
          });
        if (error) throw error;
      }
      alert(editingCoupon ? 'Coupon updated!' : 'Coupon created!');
      setIsCouponModalOpen(false);
      setEditingCoupon(null);
      loadCoupons();
    } catch (err: any) {
      console.error('Coupon submit failed:', err);
      alert('Failed to save coupon: ' + (err.message || err));
    }
  };

  const handleDeleteCoupon = async (code: string) => {
    if (!window.confirm(`Delete coupon "${code}"?`)) return;
    try {
      const { error } = await supabase.from('coupons').delete().eq('code', code);
      if (error) throw error;
      alert('Coupon deleted!');
      loadCoupons();
    } catch (err: any) {
      console.error('Coupon delete failed:', err);
      alert('Failed to delete coupon: ' + (err.message || err));
    }
  };

  const handleToggleCoupon = async (code: string) => {
    const coupon = coupons.find(c => c.code === code);
    if (!coupon) return;
    try {
      const { error } = await supabase.from('coupons').update({ active: !coupon.active }).eq('code', code);
      if (error) throw error;
      loadCoupons();
    } catch (err: any) {
      console.error('Coupon toggle failed:', err);
      alert('Failed to toggle coupon status: ' + (err.message || err));
    }
  };

  // --- Announcement Management ---
  const loadAnnouncement = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('site_announcements')
        .select('message')
        .eq('active', true)
        .order('created_at', { ascending: false })
        .limit(1);

      if (!error && data && data.length > 0) {
        setAnnouncementText(data[0].message);
        localStorage.setItem('animemaze_announcement', data[0].message);
        return;
      }
    } catch (err) {
      console.warn('Failed to load announcement from DB:', err);
    }
    // Fallback to localStorage
    setAnnouncementText(localStorage.getItem('animemaze_announcement') || '🎉 Special Launch Offer: Use code ANIME20 for 20% discount! 🚚 FREE Shipping on orders above ₹999!');
  }, []);

  const handleSaveAnnouncement = async () => {
    try {
      // Deactivate all previous announcements first to keep a single active one
      await supabase
        .from('site_announcements')
        .update({ active: false })
        .eq('active', true);

      const { error } = await supabase
        .from('site_announcements')
        .insert({ message: announcementText, active: true });

      if (error) throw error;
      alert('Announcement updated! (synced to database)');
    } catch (err) {
      console.warn('Supabase announcement save failed:', err);
      alert('Announcement updated locally only');
    }
    localStorage.setItem('animemaze_announcement', announcementText);
    window.dispatchEvent(new Event('announcement_updated'));
  };

  const handleClearAnnouncement = async () => {
    setAnnouncementText('');
    try {
      await supabase
        .from('site_announcements')
        .update({ active: false })
        .eq('active', true);
    } catch (err) {
      console.warn('Supabase announcement clear failed:', err);
    }
    localStorage.setItem('animemaze_announcement', '');
    window.dispatchEvent(new Event('announcement_updated'));
    alert('Announcement cleared!');
  };

  // --- CRUD: Products ---
  const handleProductSubmit = async (e: React.FormEvent) => {
    if (submittingProduct) return;
    e.preventDefault();
    setSubmittingProduct(true);
    try {
      const addImgs = productForm.additional_images
        ? productForm.additional_images.split(',').map(img => img.trim()).filter(Boolean)
        : [];

      // Always sanitize slug: strip URLs and special chars
      const rawSlug = productForm.slug.trim();
      const isValidSlug = rawSlug && !rawSlug.includes('://') && !rawSlug.includes('.com') && /^[a-z0-9-]+$/.test(rawSlug.toLowerCase());
      const finalSlug = isValidSlug
        ? rawSlug.toLowerCase()
        : productForm.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

      const activeVariants = variantDrafts.filter(v => Object.keys(v.attributes).length > 0);
      const shouldHaveVariants = hasVariants && activeVariants.length > 0;

      const variantConfigData = shouldHaveVariants ? {
        enabledOptions: optionDrafts.filter(o => o.values.length > 0).map(o => o.id),
        options: optionDrafts.filter(o => o.values.length > 0).map(o => ({
          id: o.id,
          name: o.name,
          type: o.type,
          required: o.required,
          values: o.type === 'color' ? o.values : o.values.map(v => v.label)
        }))
      } : { enabledOptions: [], options: [] };

      // Calculate total stock and display price from variants if has variants
      let finalPrice = Number(productForm.price);
      let finalStock = Number(productForm.stock);
      if (shouldHaveVariants) {
        const activeOnly = activeVariants.filter(v => v.active);
        if (activeOnly.length > 0) {
          finalPrice = Math.min(...activeOnly.map(v => v.price));
          finalStock = activeOnly.reduce((sum, v) => sum + v.stock, 0);
        }
      }

      const payload = {
        name: productForm.name.trim(),
        slug: finalSlug,
        description: productForm.description.trim(),
        price: finalPrice,
        stock: finalStock,
        featured: Boolean(productForm.featured),
        category_id: productForm.category_id || null,
        main_image_url: productForm.main_image_url.trim(),
        additional_images: addImgs,
        sku: productForm.sku.trim() || null,
        brand: productForm.brand.trim() || 'Elite Bath Collections',
        material: productForm.material.trim() || null,
        finish: productForm.finish.trim() || null,
        warranty_info: productForm.warranty_info.trim() || null,
        has_variants: shouldHaveVariants,
        variant_config: variantConfigData,
        is_new_arrival: Boolean(productForm.is_new_arrival),
        is_active: Boolean(productForm.is_active),
      };

      let targetId = editingProduct ? editingProduct.id : '';

      try {
        if (editingProduct) {
          const { error } = await supabase
            .from('products')
            .update(payload)
            .eq('id', editingProduct.id);
          
          if (error) throw error;
        } else {
          const { data: newProd, error } = await supabase
            .from('products')
            .insert(payload)
            .select('id')
            .single();
          
          if (error) throw error;
          targetId = newProd?.id || '';
        }

        // Sync variants in public.product_variants
        if (targetId) {
          await supabase.from('product_variants').delete().eq('product_id', targetId);
          if (shouldHaveVariants) {
            const rows = activeVariants.map((v) => ({
              product_id: targetId,
              sku: v.sku.trim() || null,
              price: Number(v.price),
              stock: Number(v.stock),
              image_url: v.image_url?.trim() || null,
              attributes: v.attributes,
              active: v.active !== false,
            }));
            await supabase.from('product_variants').insert(rows);
          }
        }
      } catch (dbErr) {
        console.warn('Supabase DB save error, applying local state update:', dbErr);
      }

      // Update local state in Admin
      const updatedProductObj: Product = {
        id: targetId || (editingProduct ? editingProduct.id : `prod-local-${Date.now()}`),
        ...payload,
        category: categories.find(c => c.id === payload.category_id),
        variants: shouldHaveVariants ? activeVariants.map((v, i) => ({
          id: v.id || `var-${Date.now()}-${i}`,
          product_id: targetId || 'local',
          sku: v.sku,
          price: v.price,
          stock: v.stock,
          image_url: v.image_url || null,
          attributes: v.attributes,
          active: v.active,
        })) : undefined,
        created_at: editingProduct ? editingProduct.created_at : new Date().toISOString()
      };

      if (editingProduct) {
        setProducts(prev => prev.map(p => p.id === editingProduct.id ? updatedProductObj : p));
        useCatalogStore.getState().updateProduct(updatedProductObj);
      } else {
        setProducts(prev => [updatedProductObj, ...prev]);
        useCatalogStore.getState().addProduct(updatedProductObj);
      }

      void useCatalogStore.getState().fetchProducts(true);
      void loadAdminData();

      alert(editingProduct ? 'Product updated successfully!' : 'Product created successfully!');
      setIsProductModalOpen(false);
      setEditingProduct(null);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Product action failed.');
    } finally {
      setSubmittingProduct(false);
    }
  };

  const handleEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setProductForm({
      name: prod.name,
      slug: prod.slug,
      description: prod.description || '',
      price: prod.price,
      stock: prod.stock,
      featured: prod.featured,
      category_id: prod.category_id || '',
      main_image_url: prod.main_image_url,
      additional_images: Array.isArray(prod.additional_images) ? prod.additional_images.join(', ') : '',
      sku: prod.sku || '',
      brand: prod.brand || 'Elite Bath Collections',
      material: prod.material || '',
      finish: prod.finish || '',
      warranty_info: prod.warranty_info || '',
      is_new_arrival: Boolean(prod.is_new_arrival),
      is_active: prod.is_active !== false
    });

    setHasVariants(Boolean(prod.has_variants));

    if (prod.variant_config?.options && prod.variant_config.options.length > 0) {
      setOptionDrafts(prod.variant_config.options.map((opt) => ({
        id: opt.id,
        name: opt.name,
        type: opt.type || (opt.id === 'color' ? 'color' : 'button'),
        required: opt.required !== false,
        values: opt.values.map((v) => {
          if (typeof v === 'string') {
            return { id: v.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''), label: v };
          }
          return { id: v.id, label: v.label, colorHex: v.colorHex };
        })
      })));
    } else {
      setOptionDrafts([]);
    }

    if (prod.variants && prod.variants.length > 0) {
      setVariantDrafts(prod.variants.map((v) => ({
        id: v.id,
        sku: v.sku || '',
        price: v.price,
        stock: v.stock,
        image_url: v.image_url || '',
        attributes: v.attributes || {},
        active: v.active !== false
      })));
    } else {
      setVariantDrafts([]);
    }

    setIsProductModalOpen(true);
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      try {
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) throw error;
      } catch (dbErr) {
        console.warn('Supabase product delete warning:', dbErr);
      }
      useCatalogStore.getState().deleteProduct(id);
      setProducts(prev => prev.filter(p => p.id !== id));
      void useCatalogStore.getState().fetchProducts(true);
      alert('Product deleted successfully!');
    } catch (err: any) {
      console.error('Failed to delete product:', err);
      alert('Failed to delete product: ' + (err.message || err));
    }
  };

  // --- CRUD: Categories ---
  const handleCategorySubmit = async (e: React.FormEvent) => {
    if (submittingCategory) return;
    e.preventDefault();
    setSubmittingCategory(true);
    try {
      const payload = {
        name: categoryForm.name.trim(),
        image_url: categoryForm.image_url.trim(),
      };

      let targetCatId = editingCategory ? editingCategory.id : '';

      try {
        if (editingCategory) {
          const { error } = await supabase
            .from('categories')
            .update(payload)
            .eq('id', editingCategory.id);
          if (error) throw error;
        } else {
          const { data: newCat, error } = await supabase
            .from('categories')
            .insert(payload)
            .select('id')
            .single();
          if (error) throw error;
          targetCatId = newCat?.id || '';
        }
      } catch (dbErr) {
        console.warn('Supabase category save error, saving to local persistent store:', dbErr);
      }

      const newCategoryObj: Category = {
        id: targetCatId || (editingCategory ? editingCategory.id : `cat-local-${Date.now()}`),
        name: categoryForm.name.trim(),
        image_url: categoryForm.image_url.trim(),
        size_enabled: categoryForm.size_enabled,
        created_at: editingCategory ? editingCategory.created_at : new Date().toISOString()
      };

      if (editingCategory) {
        useCatalogStore.getState().updateCategory(newCategoryObj);
      } else {
        useCatalogStore.getState().addCategory(newCategoryObj);
      }

      alert(editingCategory ? 'Category updated successfully!' : 'Category created successfully!');
      setIsCategoryModalOpen(false);
      setEditingCategory(null);
      void loadAdminData();
      void useCatalogStore.getState().fetchCategories(true);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Category action failed.');
    } finally {
      setSubmittingCategory(false);
    }
  };

  const handleEditCategory = (cat: Category) => {
    setEditingCategory(cat);
    setCategoryForm({
      name: cat.name,
      image_url: cat.image_url,
      size_enabled: cat.size_enabled || false
    });
    setIsCategoryModalOpen(true);
  };

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this category? (Products inside will set category to null)')) return;
    try {
      try {
        const { error } = await supabase.from('categories').delete().eq('id', id);
        if (error) throw error;
      } catch (dbErr) {
        console.warn('Supabase category delete warning:', dbErr);
      }
      useCatalogStore.getState().deleteCategory(id);
      alert('Category deleted successfully!');
      void loadAdminData();
      void useCatalogStore.getState().fetchCategories(true);
    } catch (err: any) {
      console.error('Failed to delete category:', err);
      alert('Failed to delete category: ' + (err.message || err));
    }
  };

  // --- Actions: Update Order Status ---
  const performOrderStatusUpdate = async (
    orderId: string,
    status: string,
    trackingInfo?: { carrier: string; tracking_number: string; shipped_at: string }
  ) => {
    // 1. Immediately update React state for instant UI responsiveness
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        const currentShipping = (o.shipping_address as any) || {};
        const updatedShipping = {
          ...currentShipping,
          ...(trackingInfo ? { tracking_info: trackingInfo } : {}),
        };
        return {
          ...o,
          status: status as any,
          shipping_address: updatedShipping,
        };
      })
    );

    // 2. Persist to localStorage for reliable offline / local orders
    try {
      const raw =
        localStorage.getItem('elitebath_local_orders') ||
        localStorage.getItem('animemaze_local_orders') ||
        '[]';
      const localList = JSON.parse(raw);
      let found = false;
      const updatedLocal = localList.map((lo: any) => {
        if (lo.id === orderId) {
          found = true;
          return {
            ...lo,
            status,
            shipping_address: {
              ...(lo.shipping_address || {}),
              ...(trackingInfo ? { tracking_info: trackingInfo } : {}),
            },
          };
        }
        return lo;
      });
      if (found) {
        localStorage.setItem('elitebath_local_orders', JSON.stringify(updatedLocal));
        localStorage.setItem('animemaze_local_orders', JSON.stringify(updatedLocal));
      }
    } catch (e) {
      console.warn('Could not update local storage order:', e);
    }

    // 3. Sync to Supabase database
    try {
      const { data: orderData } = await supabase
        .from('orders')
        .select('shipping_address')
        .eq('id', orderId)
        .maybeSingle();

      if (orderData) {
        const currentShipping = orderData?.shipping_address || {};
        const updatedShipping = {
          ...currentShipping,
          ...(trackingInfo ? { tracking_info: trackingInfo } : {}),
        };

        const { error } = await supabase
          .from('orders')
          .update({
            status,
            shipping_address: updatedShipping,
          })
          .eq('id', orderId);

        if (error) console.warn('Supabase order status sync warning:', error);
      }
      alert(`Order status updated to ${status}!`);
    } catch (err: any) {
      console.warn('Order status sync warning (offline):', err);
      alert(`Order status updated to ${status}!`);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    if (status === 'SHIPPED' || status === 'OUT_FOR_DELIVERY') {
      const order = orders.find((o) => o.id === orderId);
      const tracking = (order?.shipping_address as any)?.tracking_info || {};
      setTrackingOrderId(orderId);
      setTrackingCarrier(tracking.carrier || 'Delhivery Express');
      setTrackingNumber(tracking.tracking_number || '');
      setTrackingTargetStatus(status);
      setIsTrackingModalOpen(true);
      return;
    }
    await performOrderStatusUpdate(orderId, status);
  };

  const handleSaveTracking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingCarrier.trim() || !trackingNumber.trim()) {
      alert('Please fill in both carrier and tracking number.');
      return;
    }
    const trackingInfo = {
      carrier: trackingCarrier.trim(),
      tracking_number: trackingNumber.trim(),
      shipped_at: new Date().toISOString(),
    };
    setIsTrackingModalOpen(false);
    await performOrderStatusUpdate(
      trackingOrderId,
      trackingTargetStatus || 'SHIPPED',
      trackingInfo
    );
  };

  // --- Actions: Edit Estimated Delivery Date ---
  const handleEditDeliveryDate = (orderId: string, currentDate: string | null) => {
    setEditingDeliveryDateOrderId(orderId);
    setEditingDeliveryDate(currentDate ? new Date(currentDate).toISOString().split('T')[0] : '');
  };

  const handleSaveDeliveryDate = async () => {
    if (!editingDeliveryDateOrderId || !editingDeliveryDate) return;
    const isoDate = new Date(editingDeliveryDate).toISOString();

    // 1. Update React state immediately
    setOrders((prev) =>
      prev.map((o) =>
        o.id === editingDeliveryDateOrderId ? { ...o, estimated_delivery_date: isoDate } : o
      )
    );

    // 2. Update localStorage
    try {
      const raw =
        localStorage.getItem('elitebath_local_orders') ||
        localStorage.getItem('animemaze_local_orders') ||
        '[]';
      const localList = JSON.parse(raw);
      const updatedLocal = localList.map((lo: any) =>
        lo.id === editingDeliveryDateOrderId ? { ...lo, estimated_delivery_date: isoDate } : lo
      );
      localStorage.setItem('elitebath_local_orders', JSON.stringify(updatedLocal));
      localStorage.setItem('animemaze_local_orders', JSON.stringify(updatedLocal));
    } catch (e) {
      console.warn('Error updating local storage delivery date:', e);
    }

    // 3. Update Supabase
    try {
      const { error } = await supabase
        .from('orders')
        .update({ estimated_delivery_date: isoDate })
        .eq('id', editingDeliveryDateOrderId);

      if (error) console.warn('Supabase delivery date update error:', error);
      alert('Estimated delivery date updated successfully!');
    } catch (err: any) {
      console.warn('Failed to update remote delivery date:', err);
      alert('Estimated delivery date updated!');
    } finally {
      setEditingDeliveryDateOrderId(null);
      setEditingDeliveryDate('');
    }
  };

  // --- Actions: Q&A --- always try DB first
  const handleAnswerQuestion = async (questionId: string, answer: string) => {
    if (!answer.trim()) return;

    try {
      const { error } = await supabase
        .from('product_questions')
        .update({ answer: answer.trim() })
        .eq('id', questionId);

      if (error) throw error;
      alert('Answer submitted successfully!');
      loadAdminData();
    } catch (err: any) {
      console.error('Answer submit failed:', err);
      alert('Failed to submit answer: ' + (err.message || err));
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!window.confirm('Delete this question?')) return;

    try {
      const { error } = await supabase.from('product_questions').delete().eq('id', id);
      if (error) throw error;
      alert('Question deleted successfully!');
      loadAdminData();
    } catch (err: any) {
      console.error('Delete question failed:', err);
      alert('Failed to delete question: ' + (err.message || err));
    }
  };

  // --- Actions: Review Moderation --- always try DB first
  const handleModerateReview = async (reviewId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      const { error } = await supabase
        .from('reviews')
        .update({ status })
        .eq('id', reviewId);

      if (error) throw error;
      alert(`Review status updated to ${status}.`);
      loadAdminData();
    } catch (err: any) {
      console.error('Review moderation failed:', err);
      alert('Failed to update review status: ' + (err.message || err));
    }
  };

  const handleDeleteReview = async (id: string) => {
    if (!window.confirm('Delete this review permanently?')) return;
    try {
      const { error } = await supabase.from('reviews').delete().eq('id', id);
      if (error) throw error;
      alert('Review deleted successfully!');
      loadAdminData();
    } catch (err: any) {
      console.error('Failed to delete review:', err);
      alert('Failed to delete review: ' + (err.message || err));
    }
  };

  // --- Export Subscribers CSV ---
  const exportSubscribersCSV = () => {
    if (subscribers.length === 0) return;
    const csvRows = [
      ['ID', 'Email', 'Subscribed At'],
      ...subscribers.map(sub => [sub.id, sub.email, new Date(sub.created_at).toLocaleString()])
    ];
    const csvContent = "data:text/csv;charset=utf-8," + csvRows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `newsletter_subscribers_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered Orders Calculation & Metrics
  const filteredOrders = orders.filter((order) => {
    if (orderSearchQuery.trim()) {
      const q = orderSearchQuery.toLowerCase().trim();
      const addr = order.shipping_address || {};
      const matchesId = (order.id || '').toLowerCase().includes(q);
      const matchesName = (addr.fullName || '').toLowerCase().includes(q);
      const matchesPhone = (addr.phone || '').toLowerCase().includes(q);
      const matchesEmail = (addr.email || '').toLowerCase().includes(q);
      const matchesCity = (addr.city || '').toLowerCase().includes(q);
      const matchesPincode = (addr.pincode || '').toLowerCase().includes(q);
      const matchesTxid = (addr.transactionId || addr.paymentId || '').toLowerCase().includes(q);
      const matchesItem = (order.items || []).some(
        (it: any) =>
          (it.product?.name || it.product_name || '').toLowerCase().includes(q) ||
          (it.selected_variant || '').toLowerCase().includes(q) ||
          (it.sku || it.product?.sku || '').toLowerCase().includes(q)
      );

      if (!matchesId && !matchesName && !matchesPhone && !matchesEmail && !matchesCity && !matchesPincode && !matchesTxid && !matchesItem) {
        return false;
      }
    }

    if (orderStatusFilter !== 'ALL') {
      if (order.status !== orderStatusFilter) return false;
    }

    if (orderPaymentFilter !== 'ALL') {
      if (orderPaymentFilter === 'PAID') {
        if (order.payment_status !== 'PAID' && order.payment_status !== 'COMPLETED' && order.status !== 'PAID') return false;
      } else if (order.payment_status !== orderPaymentFilter) {
        return false;
      }
    }

    return true;
  });

  const totalRevenue = orders
    .filter((o) => o.payment_status === 'PAID' || o.payment_status === 'COMPLETED' || o.status === 'PAID' || o.status === 'DELIVERED')
    .reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);

  const activeFulfillmentCount = orders.filter((o) =>
    ['PROCESSING', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY'].includes(o.status)
  ).length;

  const deliveredCount = orders.filter((o) => o.status === 'DELIVERED').length;

  if (!user || profile?.role !== 'admin') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md border border-gray-200"
      >
        <Menu className="h-6 w-6 text-gray-700" />
      </button>

      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar / Drawer */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-8 w-8 text-primary" />
                <h1 className="text-xl font-extrabold text-gray-900">Admin Panel</h1>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="lg:hidden p-1 hover:bg-gray-100 rounded"
              >
                <CloseIcon className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <p className="text-xs text-gray-600 mt-2">Manage your store</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {(['verification', 'products', 'categories', 'orders', 'inventory', 'questions', 'reviews', 'subscribers', 'replacements', 'coupons', 'announcement'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full text-left px-4 py-3 rounded-lg text-sm font-semibold uppercase tracking-wider transition-all flex items-center gap-3 ${
                  activeTab === tab
                    ? 'bg-primary/10 text-primary border border-primary/20 font-bold'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 border border-transparent'
                }`}
              >
                <span className="flex-1">{tab.replace('_', ' ')}</span>
                {activeTab === tab && (
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                )}
              </button>
            ))}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-gray-200">
            <Button
              size="sm"
              variant="outline"
              onClick={loadAdminData}
              className="w-full"
            >
              <RefreshCcw className="h-4 w-4 mr-2" />
              Refresh Data
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 lg:p-8 lg:ml-0">
        <div className="max-w-7xl mx-auto">
          {/* Desktop Header */}
          <div className="hidden lg:flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-2">
                <ShieldCheck className="h-8 w-8 text-primary" />
                <span>Admin Control Panel</span>
              </h1>
              <p className="text-sm text-gray-600 mt-1">Manage payments, inventory, catalogs, Q&A, and reviews</p>
            </div>
          </div>

          {/* Mobile Header Spacer */}
          <div className="lg:hidden h-16" />

          {loadingData ? (
            <div className="py-20 flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary" />
            </div>
          ) : (
            <div className="space-y-8">
          
          {/* TAB 1: Payment Verification Panel */}
          {activeTab === 'verification' && (
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
              <h2 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
                <CreditCard className="h-5.5 w-5.5 text-secondary" />
                <span>Order Status Management</span>
              </h2>

              <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl">
                <p className="text-sm text-gray-700">
                  <strong className="text-primary">Note:</strong> Payments are processed securely via Razorpay (automated signature verification) and Direct UPI QR (UTR/transaction proof verification).
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-gray-50 text-xs font-bold uppercase tracking-wider text-gray-500 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4">Order ID</th>
                      <th className="px-6 py-4">Customer Details</th>
                      <th className="px-6 py-4">Amount</th>
                      <th className="px-6 py-4 text-center">Order Status</th>
                      <th className="px-6 py-4 text-center">Payment Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {orders.filter(o => ['PENDING_PAYMENT', 'PAID', 'CANCELLED'].includes(o.status)).length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500 italic">
                          No recent orders found.
                        </td>
                      </tr>
                    ) : (
                      orders
                        .filter(o => ['PENDING_PAYMENT', 'PAID', 'CANCELLED'].includes(o.status))
                        .slice(0, 15)
                        .map((order) => (
                          <tr key={order.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 font-bold text-xs truncate max-w-[120px]">{order.id}</td>
                            <td className="px-6 py-4 max-w-[200px]">
                              <div className="space-y-0.5">
                                <p className="font-bold text-gray-900">{order.shipping_address?.fullName}</p>
                                <p className="text-xs text-gray-500">{order.shipping_address?.phone}</p>
                                <p className="text-xs text-gray-600 truncate">{order.shipping_address?.address}</p>
                                <p className="text-xs text-gray-500">{order.shipping_address?.city}, {order.shipping_address?.state}</p>
                              </div>
                            </td>
                            <td className="px-6 py-4 font-extrabold text-gray-900">₹{order.total_amount}</td>
                            <td className="px-6 py-4 text-center">
                              {order.status === 'PENDING_PAYMENT' && (
                                <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-warning/10 border border-warning/20 text-warning rounded-lg text-xs font-semibold">
                                  <span>⏳ Pending Payment</span>
                                </span>
                              )}
                              {order.status === 'PAID' && (
                                <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-success/10 border border-success/20 text-success rounded-lg text-xs font-semibold">
                                  <Check className="h-3.5 w-3.5" />
                                  <span>Paid</span>
                                </span>
                              )}
                              {order.status === 'CANCELLED' && (
                                <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-danger/10 border border-danger/20 text-danger rounded-lg text-xs font-semibold">
                                  <X className="h-3.5 w-3.5" />
                                  <span>Cancelled</span>
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-center">
                              {order.payment_status === 'PENDING_PAYMENT' && (
                                <span className="text-xs text-warning font-medium">Awaiting Payment</span>
                              )}
                              {order.payment_status === 'PAID' && (
                                <span className="text-xs text-success font-medium">Paid</span>
                              )}
                              {order.payment_status === 'FAILED' && (
                                <span className="text-xs text-danger font-medium">Failed</span>
                              )}
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: Products Manager */}
          {activeTab === 'products' && (
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
                    <ShoppingBag className="h-5.5 w-5.5 text-secondary" />
                    <span>Products Library</span>
                  </h2>
                  <p className="text-xs text-gray-500">
                    Manage sanitaryware collections, base specifications, and multi-attribute product variants.
                  </p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="relative flex-grow sm:w-64">
                    <Search className="h-4 w-4 text-gray-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search by name, SKU..."
                      value={productSearchQuery}
                      onChange={(e) => setProductSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs bg-gray-50 border border-gray-200 text-gray-900 focus:outline-none focus:border-primary"
                    />
                  </div>
                  <Button size="sm" onClick={() => {
                    setEditingProduct(null);
                    setProductForm({
                      name: '',
                      slug: '',
                      description: '',
                      price: 0,
                      stock: 0,
                      featured: false,
                      category_id: '',
                      main_image_url: '',
                      additional_images: '',
                      sku: '',
                      brand: 'Elite Bath Collections',
                      material: '',
                      finish: '',
                      warranty_info: '',
                      is_new_arrival: false,
                      is_active: true,
                    });
                    setHasVariants(false);
                    setOptionDrafts([]);
                    setVariantDrafts([]);
                    setIsProductModalOpen(true);
                  }}>
                    <Plus className="mr-1.5 h-4 w-4" /> Add Product
                  </Button>
                </div>
              </div>

              {/* Products Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-gray-50 text-xs font-bold uppercase text-gray-400 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4">Image</th>
                      <th className="px-6 py-4">Product Name & SKU</th>
                      <th className="px-6 py-4">Category</th>
                      <th className="px-6 py-4">Specs & Finishes</th>
                      <th className="px-6 py-4">Price & Variants</th>
                      <th className="px-6 py-4">Stock</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {products
                      .filter((prod) => {
                        if (!productSearchQuery.trim()) return true;
                        const q = productSearchQuery.toLowerCase();
                        return (
                          prod.name.toLowerCase().includes(q) ||
                          prod.slug.toLowerCase().includes(q) ||
                          (prod.sku && prod.sku.toLowerCase().includes(q)) ||
                          (prod.brand && prod.brand.toLowerCase().includes(q)) ||
                          (prod.category?.name && prod.category.name.toLowerCase().includes(q))
                        );
                      })
                      .map((prod) => (
                      <tr key={prod.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-3">
                          <img src={prod.main_image_url} alt="" className="w-12 h-14 object-cover rounded-xl bg-gray-100 border border-gray-200 shadow-sm" />
                        </td>
                        <td className="px-6 py-3">
                          <p className="font-bold text-gray-900 text-sm hover:text-primary">{prod.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {prod.sku && (
                              <span className="text-[10px] text-gray-500 font-mono bg-gray-100 px-1.5 py-0.5 rounded">
                                {prod.sku}
                              </span>
                            )}
                            <span className="text-[10px] text-gray-400">
                              {prod.brand || 'Elite Bath'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-3 text-xs text-gray-700 font-medium">
                          {prod.category?.name || 'Unassigned'}
                        </td>
                        <td className="px-6 py-3 text-xs text-gray-500">
                          <p className="text-gray-800 font-medium truncate max-w-[140px]">{prod.material || 'Standard'}</p>
                          <p className="text-[10px] text-gray-500 truncate max-w-[140px]">{prod.finish || 'Standard Finish'}</p>
                        </td>
                        <td className="px-6 py-3">
                          <span className="font-extrabold text-gray-900 block">
                            ₹{prod.price.toLocaleString('en-IN')}
                          </span>
                          {prod.has_variants && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded mt-0.5">
                              <Sliders className="h-2.5 w-2.5" />
                              {prod.variants?.length ? `${prod.variants.length} Variants` : 'Multi-Option'}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-3">
                          {prod.stock <= 0 ? (
                            <span className="text-[10px] font-bold text-danger bg-danger/10 border border-danger/20 px-2 py-0.5 rounded uppercase">
                              Out of Stock
                            </span>
                          ) : prod.stock <= 5 ? (
                            <span className="text-[10px] font-bold text-amber-600 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded uppercase">
                              {prod.stock} left
                            </span>
                          ) : (
                            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                              {prod.stock} in stock
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-3 text-right space-x-2">
                          <button
                            onClick={() => handleEditProduct(prod)}
                            className="p-1.5 bg-gray-100 border border-gray-300 hover:border-primary text-primary rounded-lg transition-colors"
                            title="Edit Product & Variants"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(prod.id)}
                            className="p-1.5 bg-gray-100 border border-gray-200 hover:border-danger/40 text-danger rounded-lg transition-colors"
                            title="Delete Product"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: Categories Manager */}
          {activeTab === 'categories' && (
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
                  <List className="h-5.5 w-5.5 text-secondary" />
                  <span>Collections / Categories</span>
                </h2>
                <Button size="sm" onClick={() => {
                  setEditingCategory(null);
                  setCategoryForm({ name: '', image_url: '', size_enabled: false });
                  setIsCategoryModalOpen(true);
                }}>
                  <Plus className="mr-1.5 h-4 w-4" /> Add Category
                </Button>
              </div>

              {/* Categories Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-gray-50 text-xs font-bold uppercase text-gray-400 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4">Image</th>
                      <th className="px-6 py-4">Category Name</th>
                      <th className="px-6 py-4">Sizes</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {categories.map((cat) => (
                      <tr key={cat.id} className="hover:bg-gray-50">
                        <td className="px-6 py-3">
                          <img src={cat.image_url} alt="" className="w-12 h-12 object-cover rounded-xl bg-gray-100 border border-gray-200" />
                        </td>
                        <td className="px-6 py-3 font-bold text-gray-900">{cat.name}</td>
                        <td className="px-6 py-3">
                          {cat.size_enabled ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-success/10 border border-success/20 text-success text-xs font-bold">
                              Enabled
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 border border-gray-300 text-gray-500 text-xs font-bold">
                              Disabled
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-3 text-right space-x-2">
                          <button
                            onClick={() => handleEditCategory(cat)}
                            className="p-1.5 bg-gray-100 border border-gray-300 text-primary rounded-lg"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(cat.id)}
                            className="p-1.5 bg-gray-100 border border-gray-300 text-danger rounded-lg"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: Orders Management */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              {/* Top Summary Metrics Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Orders</p>
                    <div className="p-2 rounded-xl bg-primary/10 text-primary">
                      <ShoppingBag className="h-4 w-4" />
                    </div>
                  </div>
                  <p className="text-2xl font-black text-gray-900 mt-2">{orders.length}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">All customer orders placed</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Revenue</p>
                    <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                      <CreditCard className="h-4 w-4" />
                    </div>
                  </div>
                  <p className="text-2xl font-black text-gray-900 mt-2">₹{totalRevenue.toLocaleString('en-IN')}</p>
                  <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">Paid & completed transactions</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400">In Fulfillment</p>
                    <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700">
                      <Package className="h-4 w-4" />
                    </div>
                  </div>
                  <p className="text-2xl font-black text-gray-900 mt-2">{activeFulfillmentCount}</p>
                  <p className="text-[11px] text-indigo-700 font-semibold mt-0.5">Processing, packed & dispatched</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Delivered</p>
                    <div className="p-2 rounded-xl bg-teal-50 text-teal-700">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                  </div>
                  <p className="text-2xl font-black text-gray-900 mt-2">{deliveredCount}</p>
                  <p className="text-[11px] text-teal-700 font-semibold mt-0.5">Safely delivered to clients</p>
                </div>
              </div>

              {/* Orders Table Container */}
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
                      <ShoppingBag className="h-5.5 w-5.5 text-primary" />
                      <span>Customer Orders & Luxury Fulfillment</span>
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Track consignments, manage order statuses, review sanitaryware variants, and generate dispatch slips
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-3 py-1 bg-gray-100 text-gray-700 rounded-full border border-gray-200">
                    Showing {filteredOrders.length} of {orders.length} orders
                  </span>
                </div>

                {/* Filter and Search Bar */}
                <div className="flex flex-col md:flex-row gap-3 pt-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={orderSearchQuery}
                      onChange={(e) => setOrderSearchQuery(e.target.value)}
                      placeholder="Search Order ID, Name, Phone, Email, City, SKU, Variant..."
                      className="w-full pl-10 pr-10 py-2 text-xs rounded-xl bg-gray-50 border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                    {orderSearchQuery && (
                      <button
                        onClick={() => setOrderSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <CloseIcon className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap sm:flex-nowrap gap-2">
                    <select
                      value={orderStatusFilter}
                      onChange={(e) => setOrderStatusFilter(e.target.value)}
                      className="text-xs bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    >
                      <option value="ALL">All Fulfillment Statuses</option>
                      <option value="PENDING_PAYMENT">Pending Payment</option>
                      <option value="PAID">Paid</option>
                      <option value="PROCESSING">Processing</option>
                      <option value="PACKED">Packed & Crated</option>
                      <option value="SHIPPED">Dispatched / Shipped</option>
                      <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                      <option value="DELIVERED">Delivered</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>

                    <select
                      value={orderPaymentFilter}
                      onChange={(e) => setOrderPaymentFilter(e.target.value)}
                      className="text-xs bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    >
                      <option value="ALL">All Payment Statuses</option>
                      <option value="PAID">Paid / Completed</option>
                      <option value="PENDING_PAYMENT">Awaiting Payment</option>
                      <option value="FAILED">Failed</option>
                    </select>

                    {(orderSearchQuery || orderStatusFilter !== 'ALL' || orderPaymentFilter !== 'ALL') && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setOrderSearchQuery('');
                          setOrderStatusFilter('ALL');
                          setOrderPaymentFilter('ALL');
                        }}
                        className="text-xs py-2"
                      >
                        Reset
                      </Button>
                    )}
                  </div>
                </div>

                {/* Orders Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-gray-50 text-[11px] font-bold uppercase text-gray-400 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3.5">Order ID & Date</th>
                        <th className="px-4 py-3.5">Customer & Shipping</th>
                        <th className="px-4 py-3.5">Ordered Items & Variants</th>
                        <th className="px-4 py-3.5">Grand Total</th>
                        <th className="px-4 py-3.5">Est. Delivery</th>
                        <th className="px-4 py-3.5">Fulfillment & Tracking</th>
                        <th className="px-4 py-3.5">Payment</th>
                        <th className="px-4 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredOrders.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                            <ShoppingBag className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                            <p className="font-semibold text-gray-700">No orders match your search or filter</p>
                            <p className="text-xs text-gray-400 mt-1">Try resetting the filter criteria</p>
                          </td>
                        </tr>
                      ) : (
                        filteredOrders.map((order) => (
                          <tr key={order.id} className="hover:bg-gray-50/80 transition-colors">
                            {/* Order ID & Date */}
                            <td className="px-4 py-4 align-top text-xs">
                              <div className="space-y-1">
                                <div className="flex items-center gap-1">
                                  <span className="font-mono font-bold text-gray-900 bg-gray-100 px-1.5 py-0.5 rounded text-[11px]">
                                    #{order.id.slice(0, 10)}
                                  </span>
                                  <button
                                    onClick={() => handleCopyText(order.id, 'Order ID')}
                                    className="p-1 text-gray-400 hover:text-primary rounded transition-colors"
                                    title="Copy full Order ID"
                                  >
                                    <Copy className="h-3 w-3" />
                                  </button>
                                </div>
                                <p className="text-[11px] text-gray-500">
                                  {order.created_at ? new Date(order.created_at).toLocaleDateString('en-IN', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric'
                                  }) : 'Recent'}
                                </p>
                                <p className="text-[10px] text-gray-400">
                                  {order.created_at ? new Date(order.created_at).toLocaleTimeString('en-IN', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  }) : ''}
                                </p>
                              </div>
                            </td>

                            {/* Customer & Shipping Details */}
                            <td className="px-4 py-4 align-top text-xs max-w-[260px]">
                              <div className="space-y-1">
                                <div className="flex items-start gap-1.5">
                                  <MapPin className="h-3.5 w-3.5 text-primary mt-0.5 flex-shrink-0" />
                                  <div className="space-y-0.5 min-w-0">
                                    <p className="font-bold text-gray-900 truncate">{order.shipping_address?.fullName || 'Guest Customer'}</p>
                                    <a
                                      href={`tel:${order.shipping_address?.phone}`}
                                      className="text-gray-600 hover:text-primary text-[11px] block truncate"
                                    >
                                      {order.shipping_address?.phone}
                                    </a>
                                    <p className="text-gray-500 text-[10px] truncate">{order.shipping_address?.email}</p>
                                    <p className="text-gray-600 text-[11px] leading-snug line-clamp-2 mt-1">
                                      {order.shipping_address?.address}
                                    </p>
                                    {order.shipping_address?.landmark && (
                                      <p className="text-gray-500 text-[10px] italic">Landmark: {order.shipping_address.landmark}</p>
                                    )}
                                    <p className="text-gray-700 font-medium text-[11px]">
                                      {order.shipping_address?.city}, {order.shipping_address?.state} - {order.shipping_address?.pincode}
                                    </p>
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleCopyAddress(order)}
                                  className="inline-flex items-center gap-1 text-[10px] text-primary hover:text-primary-hover font-semibold mt-1"
                                >
                                  <Copy className="h-3 w-3" />
                                  Copy Address
                                </button>
                              </div>
                            </td>

                            {/* Ordered Items & Sanitaryware Variants */}
                            <td className="px-4 py-4 align-top text-xs max-w-[280px]">
                              <div className="space-y-2.5">
                                {order.items?.map((item, idx) => {
                                  const itemSku = item.variant?.sku || item.product?.sku || (item.selected_variant_id ? `EBC-${item.selected_variant_id.slice(0, 8).toUpperCase()}` : 'EBC-SAN');
                                  const itemName = item.product?.name || (item as any).product_name || 'Sanitaryware Item';
                                  const itemImg = item.product?.main_image_url || (item as any).image_url || '/placeholder.jpg';
                                  return (
                                    <div key={item.id || `${order.id}-item-${idx}`} className="flex items-start space-x-2.5 bg-gray-50/60 p-1.5 rounded-lg border border-gray-100">
                                      <div className="w-9 h-11 bg-white rounded overflow-hidden flex-shrink-0 border border-gray-200">
                                        <img
                                          src={itemImg}
                                          alt=""
                                          className="w-full h-full object-cover"
                                          onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.jpg'; }}
                                        />
                                      </div>
                                      <div className="min-w-0 flex-1 space-y-0.5">
                                        <p className="font-semibold text-gray-900 truncate leading-tight">{itemName}</p>
                                        
                                        {/* Variant Badge */}
                                        {item.selected_variant && (
                                          <div className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[9px] font-bold">
                                            <Tag className="h-2.5 w-2.5" />
                                            <span>Option: {item.selected_variant}</span>
                                          </div>
                                        )}

                                        {/* Variant Attributes Chips */}
                                        {item.selected_attributes && Object.keys(item.selected_attributes).length > 0 && !item.selected_variant && (
                                          <div className="flex flex-wrap gap-1">
                                            {Object.entries(item.selected_attributes).map(([k, v]) => (
                                              <span key={k} className="px-1.5 py-0.2 rounded bg-gray-100 text-gray-700 text-[9px]">
                                                {k}: {v}
                                              </span>
                                            ))}
                                          </div>
                                        )}

                                        <div className="flex items-center justify-between text-[10px] text-gray-500 pt-0.5">
                                          <span className="font-mono text-gray-400">{itemSku}</span>
                                          <span className="font-bold text-gray-700">
                                            {item.quantity} × ₹{(item.price || 0).toLocaleString('en-IN')}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </td>

                            {/* Grand Total */}
                            <td className="px-4 py-4 align-top font-extrabold text-sm text-gray-900 whitespace-nowrap">
                              ₹{(Number(order.total_amount) || 0).toLocaleString('en-IN')}
                            </td>

                            {/* Est. Delivery */}
                            <td className="px-4 py-4 align-top text-xs whitespace-nowrap">
                              {editingDeliveryDateOrderId === order.id ? (
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="date"
                                    value={editingDeliveryDate}
                                    onChange={(e) => setEditingDeliveryDate(e.target.value)}
                                    className="border border-gray-300 rounded px-2 py-1 text-xs"
                                  />
                                  <button
                                    onClick={handleSaveDeliveryDate}
                                    className="p-1 bg-success/20 text-success rounded hover:bg-success/30"
                                    title="Save Date"
                                  >
                                    <Check className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingDeliveryDateOrderId(null);
                                      setEditingDeliveryDate('');
                                    }}
                                    className="p-1 bg-danger/20 text-danger rounded hover:bg-danger/30"
                                    title="Cancel"
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-semibold text-gray-800">
                                    {order.estimated_delivery_date
                                      ? new Date(order.estimated_delivery_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                                      : 'Not scheduled'}
                                  </span>
                                  <button
                                    onClick={() => handleEditDeliveryDate(order.id, order.estimated_delivery_date)}
                                    className="p-1 text-gray-400 hover:text-primary hover:bg-gray-100 rounded transition-colors"
                                    title="Edit delivery date"
                                  >
                                    <Calendar className="h-3 w-3" />
                                  </button>
                                </div>
                              )}
                            </td>

                            {/* Fulfillment Status & Courier Tracking */}
                            <td className="px-4 py-4 align-top text-xs min-w-[190px]">
                              <div className="space-y-2">
                                <select
                                  value={order.status}
                                  onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                                  className="w-full bg-white border border-gray-300 text-xs font-semibold text-gray-900 rounded-lg p-1.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                >
                                  <option value="PENDING_PAYMENT">⏳ Pending Payment</option>
                                  <option value="PAID">💳 Order Paid</option>
                                  <option value="PROCESSING">⚙️ Processing & QC</option>
                                  <option value="PACKED">📦 Packed & Crated</option>
                                  <option value="SHIPPED">🚚 Dispatched / Shipped</option>
                                  <option value="OUT_FOR_DELIVERY">🛵 Out for Delivery</option>
                                  <option value="DELIVERED">✅ Delivered</option>
                                  <option value="CANCELLED">❌ Cancelled</option>
                                  <option value="PENDING_VERIFICATION">⏳ Pending Verification</option>
                                </select>

                                {/* Carrier Tracking Card if available */}
                                {(order.shipping_address as any)?.tracking_info ? (
                                  <div className="bg-gray-50 p-2 rounded-lg border border-gray-200 text-[10px] space-y-1">
                                    <div className="flex items-center justify-between">
                                      <span className="font-bold text-gray-800 flex items-center gap-1">
                                        <Truck className="h-3 w-3 text-primary" />
                                        {(order.shipping_address as any).tracking_info.carrier}
                                      </span>
                                      <button
                                        onClick={() => {
                                          const tracking = (order.shipping_address as any).tracking_info;
                                          setTrackingOrderId(order.id);
                                          setTrackingCarrier(tracking.carrier || '');
                                          setTrackingNumber(tracking.tracking_number || '');
                                          setTrackingTargetStatus(order.status);
                                          setIsTrackingModalOpen(true);
                                        }}
                                        className="text-primary hover:underline font-bold flex items-center gap-0.5"
                                      >
                                        <Edit className="h-2.5 w-2.5" /> Edit
                                      </button>
                                    </div>
                                    <div className="flex items-center justify-between font-mono text-gray-600 bg-white px-1.5 py-0.5 rounded border border-gray-200">
                                      <span className="truncate">{(order.shipping_address as any).tracking_info.tracking_number}</span>
                                      <button
                                        onClick={() => handleCopyText((order.shipping_address as any).tracking_info.tracking_number, 'Tracking Number')}
                                        className="text-gray-400 hover:text-primary ml-1"
                                        title="Copy tracking number"
                                      >
                                        <Copy className="h-2.5 w-2.5" />
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  order.status !== 'CANCELLED' && order.status !== 'PENDING_PAYMENT' && (
                                    <button
                                      onClick={() => {
                                        setTrackingOrderId(order.id);
                                        setTrackingCarrier('Delhivery Express');
                                        setTrackingNumber('');
                                        setTrackingTargetStatus(order.status);
                                        setIsTrackingModalOpen(true);
                                      }}
                                      className="inline-flex items-center gap-1 text-[10px] text-primary hover:text-primary-hover font-semibold"
                                    >
                                      <Truck className="h-3 w-3" /> Add Tracking
                                    </button>
                                  )
                                )}
                              </div>
                            </td>

                            {/* Payment Method & Verification */}
                            <td className="px-4 py-4 align-top text-xs whitespace-nowrap">
                              <div className="space-y-1.5">
                                {/* Payment Method Badge */}
                                {order.shipping_address?.paymentMethod === 'Razorpay' || (order.shipping_address as any)?.paymentId ? (
                                  <div className="space-y-0.5">
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                                      <CreditCard className="h-2.5 w-2.5" /> Razorpay
                                    </span>
                                    {order.shipping_address?.paymentId && (
                                      <button
                                        onClick={() => handleCopyText(order.shipping_address.paymentId!, 'Payment ID')}
                                        className="block text-[9px] font-mono text-blue-700 hover:underline truncate max-w-[130px]"
                                        title="Click to copy Razorpay Payment ID"
                                      >
                                        ID: {order.shipping_address.paymentId}
                                      </button>
                                    )}
                                  </div>
                                ) : (
                                  <div className="space-y-0.5">
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                      <QrCode className="h-2.5 w-2.5" /> Direct UPI QR
                                    </span>
                                    {order.shipping_address?.transactionId && (
                                      <button
                                        onClick={() => handleCopyText(order.shipping_address.transactionId!, 'Transaction ID')}
                                        className="block text-[9px] font-mono text-amber-700 hover:underline truncate max-w-[130px]"
                                        title="Click to copy Transaction ID"
                                      >
                                        TXID: {order.shipping_address.transactionId}
                                      </button>
                                    )}
                                    {order.payment_proof?.screenshot_url && (
                                      <a
                                        href={order.payment_proof.screenshot_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-0.5 text-[9px] text-primary hover:underline font-bold"
                                      >
                                        <ExternalLink className="h-2.5 w-2.5" /> View Proof
                                      </a>
                                    )}
                                  </div>
                                )}

                                {/* Payment Status Badge */}
                                <div>
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 border rounded uppercase text-[10px] font-extrabold ${
                                    order.payment_status === 'PAID' || order.payment_status === 'COMPLETED'
                                      ? 'text-success bg-success/10 border-success/20'
                                      : order.payment_status === 'FAILED'
                                      ? 'text-danger bg-danger/10 border-danger/20'
                                      : 'text-amber-500 bg-amber-500/10 border-amber-500/20'
                                  }`}>
                                    {order.payment_status === 'PAID' || order.payment_status === 'COMPLETED' ? (
                                      <Check className="h-2.5 w-2.5" />
                                    ) : order.payment_status === 'FAILED' ? (
                                      <X className="h-2.5 w-2.5" />
                                    ) : (
                                      <Clock className="h-2.5 w-2.5" />
                                    )}
                                    <span>{order.payment_status || 'PENDING'}</span>
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Actions: Print Packing Slip */}
                            <td className="px-4 py-4 align-top text-right whitespace-nowrap">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedPackingSlipOrder(order)}
                                className="text-xs px-2.5 py-1.5 flex items-center gap-1 ml-auto"
                                title="Print Packing Slip & Invoice"
                              >
                                <Printer className="h-3.5 w-3.5" />
                                <span>Slip</span>
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Inventory Low stock Warning */}
          {activeTab === 'inventory' && (
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
              <h2 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
                <AlertTriangle className="h-5.5 w-5.5 text-danger animate-bounce" />
                <span>Inventory & Low Stock Warnings</span>
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-gray-50 text-xs font-bold uppercase text-gray-400 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4">Product Name</th>
                      <th className="px-6 py-4">Pricing</th>
                      <th className="px-6 py-4">Available Stock</th>
                      <th className="px-6 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {products.map((prod) => (
                      <tr key={prod.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <p className="font-bold text-gray-900">{prod.name}</p>
                          <p className="text-[10px] text-gray-500 font-mono">{prod.slug}</p>
                        </td>
                        <td className="px-6 py-4 font-bold text-gray-900">₹{prod.price}</td>
                        <td className="px-6 py-4 font-bold">{prod.stock}</td>
                        <td className="px-6 py-4 text-xs font-bold">
                          {prod.stock === 0 ? (
                            <span className="text-danger bg-danger/10 border border-danger/20 px-2 py-0.5 rounded uppercase">OUT OF STOCK</span>
                          ) : prod.stock <= 5 ? (
                            <span className="text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded uppercase">LOW STOCK</span>
                          ) : (
                            <span className="text-success bg-success/10 border border-success/20 px-2 py-0.5 rounded uppercase">HEALTHY</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: Questions Panel */}
          {activeTab === 'questions' && (
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
              <h2 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
                <MessageSquare className="h-5.5 w-5.5 text-secondary" />
                <span>Customer Questions</span>
              </h2>

              <div className="space-y-4">
                {questions.length === 0 ? (
                  <p className="text-gray-500 italic text-sm">No questions asked by customers yet.</p>
                ) : (
                  questions.map((q) => (
                    <div key={q.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                      <div className="flex justify-between items-start gap-4">
                        <div className="space-y-1">
                          <p className="text-xs text-gray-500 font-bold uppercase tracking-wider text-secondary">Question Details:</p>
                          <p className="text-sm font-semibold text-gray-900">"{q.question}"</p>
                          <p className="text-[10px] text-gray-500">Asked on: {new Date(q.created_at).toLocaleDateString()}</p>
                        </div>
                        <button
                          onClick={() => handleDeleteQuestion(q.id)}
                          className="text-gray-500 hover:text-danger p-1"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </button>
                      </div>

                      <div className="space-y-2 border-t border-gray-200 pt-3">
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider text-primary">Answer Details:</p>
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            const val = (e.currentTarget.elements.namedItem('answerInput') as HTMLInputElement).value;
                            handleAnswerQuestion(q.id, val);
                          }}
                          className="flex gap-2"
                        >
                          <input
                            type="text"
                            name="answerInput"
                            defaultValue={q.answer || ''}
                            placeholder="Type response answer..."
                            className="flex-grow px-3 py-1.5 rounded-lg text-xs bg-white border border-gray-300 text-gray-900 focus:outline-none focus:border-primary"
                          />
                          <button
                            type="submit"
                            className="px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary-dark"
                          >
                            Answer
                          </button>
                        </form>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 7: Reviews Moderation */}
          {activeTab === 'reviews' && (
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
              <h2 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
                <Star className="h-5.5 w-5.5 text-yellow-500 fill-current" />
                <span>Reviews Moderation</span>
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-gray-50 text-xs font-bold uppercase text-gray-400 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4">Customer</th>
                      <th className="px-6 py-4">Rating</th>
                      <th className="px-6 py-4">Comment</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {reviews.map((rev) => (
                      <tr key={rev.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-xs">
                          <p className="font-bold text-gray-900">{rev.user_name}</p>
                          {rev.verified_purchase && (
                            <span className="text-[9px] font-bold text-secondary">Verified Buyer</span>
                          )}
                        </td>
                        <td className="px-6 py-4 font-bold text-yellow-500 flex items-center gap-1">
                          {rev.rating} <Star className="h-3 w-3 fill-current" />
                        </td>
                        <td className="px-6 py-4 text-xs max-w-sm truncate">{rev.review_text}</td>
                        <td className="px-6 py-4 text-xs font-bold">
                          <span className={`px-2 py-0.5 border rounded uppercase ${
                            rev.status === 'APPROVED' ? 'text-success border-success/20 bg-success/5' :
                            rev.status === 'REJECTED' ? 'text-danger border-danger/20 bg-danger/5' :
                            'text-amber-500 border-amber-500/20 bg-amber-500/5'
                          }`}>
                            {rev.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right space-x-1.5">
                          <button
                            onClick={() => handleModerateReview(rev.id, 'APPROVED')}
                            className="p-1 bg-success/20 text-success rounded border border-success/30 hover:bg-success/35"
                            title="Approve Review"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleModerateReview(rev.id, 'REJECTED')}
                            className="p-1 bg-danger/20 text-danger rounded border border-danger/30 hover:bg-danger/35"
                            title="Reject Review"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteReview(rev.id)}
                            className="p-1 bg-gray-100 text-gray-500 hover:text-gray-900 rounded border border-gray-200"
                            title="Delete Permanently"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 8: Subscribers List */}
          {activeTab === 'subscribers' && (
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
                  <Mail className="h-5.5 w-5.5 text-secondary-light" />
                  <span>Newsletter Drops List ({subscribers.length})</span>
                </h2>
                <Button size="sm" variant="outline" onClick={exportSubscribersCSV}>
                  <Download className="mr-1.5 h-4 w-4" /> Export CSV
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-gray-50 text-xs font-bold uppercase text-gray-400 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4">Subscriber Email</th>
                      <th className="px-6 py-4">Subscribed Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {subscribers.map((sub) => (
                      <tr key={sub.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-bold text-gray-900 text-sm">{sub.email}</td>
                        <td className="px-6 py-4 text-xs text-gray-500">
                          {new Date(sub.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: Replacement Requests */}
          {activeTab === 'replacements' && (() => {
            const handleUpdateReplacement = async (id: string, status: string, adminNotes?: string) => {
              // Try DB first
              try {
                const { error } = await supabase.from('replacement_requests').update({ status, admin_notes: adminNotes || null }).eq('id', id);
                if (error) throw error;
              } catch (_) {}
              // Always update localStorage
              const stored = JSON.parse(localStorage.getItem('animemaze_replacement_requests') || '[]');
              const updated = stored.map((r: any) => r.id === id ? { ...r, status, admin_notes: adminNotes || null } : r);
              localStorage.setItem('animemaze_replacement_requests', JSON.stringify(updated));
              setReplacementRequests(prev => prev.map(r => r.id === id ? { ...r, status: status as any, admin_notes: adminNotes || null } : r));
            };

            const statusColor = (s: string) => {
              switch (s) {
                case 'PENDING': return 'text-amber-400 bg-amber-400/10 border-amber-400/25';
                case 'APPROVED': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/25';
                case 'PROCESSING': return 'text-cyan-400 bg-cyan-400/10 border-cyan-400/25';
                case 'REJECTED': return 'text-red-400 bg-red-400/10 border-red-400/25';
                case 'RESOLVED': return 'text-green-400 bg-green-400/10 border-green-400/25';
                default: return 'text-gray-400 bg-gray-400/10 border-gray-400/25';
              }
            };

            return (
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
                    <RefreshCcw className="h-5 w-5 text-amber-400" />
                    <span>Replacement Requests</span>
                    {replacementRequests.filter(r => r.status === 'PENDING').length > 0 && (
                      <span className="ml-2 px-2 py-0.5 text-xs font-extrabold rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        {replacementRequests.filter(r => r.status === 'PENDING').length} New
                      </span>
                    )}
                  </h2>
                </div>

                {replacementRequests.length === 0 ? (
                  <div className="py-12 text-center text-gray-500 italic text-sm">
                    No replacement requests yet.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {replacementRequests.map((req) => (
                      <div key={req.id} className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="space-y-1">
                            <p className="text-xs text-gray-500">Request ID: <span className="font-bold text-gray-300">{req.id}</span></p>
                            <p className="text-xs text-gray-500">Order ID: <span className="font-bold text-gray-300">{req.order_id}</span></p>
                            <p className="text-xs text-gray-400">{new Date(req.created_at).toLocaleString()}</p>
                          </div>
                          <span className={`self-start text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase border ${statusColor(req.status)}`}>
                            {req.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Reason</p>
                            <p className="text-gray-900 font-medium">{req.reason}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Description</p>
                            <p className="text-gray-300 text-xs leading-relaxed">{req.description}</p>
                          </div>
                        </div>

                        {req.photo_url && (
                          <div>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Attached Photo</p>
                            <a href={req.photo_url} target="_blank" rel="noopener noreferrer" className="inline-block">
                              <img src={req.photo_url} alt="Replacement proof" className="w-24 h-24 object-cover rounded-xl border border-gray-200 hover:border-primary/50 transition-all" />
                            </a>
                          </div>
                        )}

                        {req.admin_notes && (
                          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Admin Notes</p>
                            <p className="text-sm text-gray-600">{req.admin_notes}</p>
                          </div>
                        )}

                        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-gray-200">
                          <select
                            value={req.status}
                            onChange={(e) => handleUpdateReplacement(req.id, e.target.value)}
                            className="bg-white border border-gray-300 text-xs text-gray-900 rounded-lg py-2 px-3 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                          >
                            {['PENDING', 'APPROVED', 'PROCESSING', 'RESOLVED', 'REJECTED'].map(s => (
                              <option key={s} value={s} className="bg-surface">{s}</option>
                            ))}
                          </select>

                          <button
                            onClick={() => {
                              const notes = window.prompt('Add admin note (optional):', req.admin_notes || '');
                              if (notes !== null) handleUpdateReplacement(req.id, req.status, notes);
                            }}
                            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-200 text-xs text-gray-700 hover:text-gray-900 rounded-lg transition-all"
                          >
                            Add Note
                          </button>

                          <button
                            onClick={() => handleUpdateReplacement(req.id, 'APPROVED')}
                            className="px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-xs text-emerald-400 rounded-lg transition-all"
                          >
                            ✓ Approve
                          </button>

                          <button
                            onClick={() => handleUpdateReplacement(req.id, 'REJECTED')}
                            className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-xs text-red-400 rounded-lg transition-all"
                          >
                            ✗ Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}

          {/* TAB: Coupon Management */}
          {activeTab === 'coupons' && (
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
                  <Tag className="h-5 w-5 text-emerald-400" />
                  <span>Promo Coupons</span>
                  <span className="ml-2 text-xs text-gray-400 font-normal">({coupons.filter(c => c.active).length} active)</span>
                </h2>
                <Button size="sm" onClick={() => {
                  setEditingCoupon(null);
                  setCouponForm({ code: '', type: 'PERCENT', value: 0, minOrder: 0, active: true });
                  setIsCouponModalOpen(true);
                }}>
                  <Plus className="mr-1.5 h-4 w-4" /> Add Coupon
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-gray-50 text-xs font-bold uppercase text-gray-400 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4">Code</th>
                      <th className="px-6 py-4">Type</th>
                      <th className="px-6 py-4">Value</th>
                      <th className="px-6 py-4">Min Order</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {coupons.map((coupon) => (
                      <tr key={coupon.code} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <span className="font-extrabold text-gray-900 bg-gray-100 px-2.5 py-1 rounded-lg text-xs tracking-wider">{coupon.code}</span>
                        </td>
                        <td className="px-6 py-4 text-xs">
                          <span className={`px-2 py-0.5 rounded border font-bold uppercase ${
                            coupon.type === 'PERCENT' ? 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20' : 'text-amber-400 bg-amber-400/10 border-amber-400/20'
                          }`}>
                            {coupon.type === 'PERCENT' ? 'Percentage' : 'Fixed Amount'}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-bold text-gray-900">
                          {coupon.type === 'PERCENT' ? `${coupon.value}%` : `₹${coupon.value}`}
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-400">
                          {coupon.minOrder > 0 ? `₹${coupon.minOrder}` : 'None'}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleToggleCoupon(coupon.code)}
                            className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase border cursor-pointer transition-all ${
                              coupon.active !== false
                                ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/25 hover:bg-emerald-400/20'
                                : 'text-red-400 bg-red-400/10 border-red-400/25 hover:bg-red-400/20'
                            }`}
                          >
                            {coupon.active !== false ? 'Active' : 'Disabled'}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button
                            onClick={() => {
                              setEditingCoupon(coupon);
                              setCouponForm({
                                code: coupon.code,
                                type: coupon.type,
                                value: coupon.value,
                                minOrder: coupon.minOrder || 0,
                                active: coupon.active !== false
                              });
                              setIsCouponModalOpen(true);
                            }}
                            className="p-1.5 bg-gray-100 border border-gray-300 hover:border-primary text-primary rounded-lg"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCoupon(coupon.code)}
                            className="p-1.5 bg-gray-100 border border-gray-200 hover:border-danger/40 text-danger rounded-lg"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 text-xs text-gray-400 space-y-1">
                <p className="font-bold text-gray-300">How Coupons Work:</p>
                <p>• <strong>Percentage</strong> coupons apply a % discount on the cart subtotal (before shipping).</p>
                <p>• <strong>Fixed Amount</strong> coupons subtract a flat ₹ amount from the subtotal.</p>
                <p>• Coupons are separate from the Free Shipping logic (orders ≥₹999 ship free automatically).</p>
                <p>• Disable a coupon to stop it from being used without deleting it.</p>
              </div>
            </div>
          )}

          {/* TAB: Announcement Bar */}
          {activeTab === 'announcement' && (
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
              <h2 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
                <Megaphone className="h-5 w-5 text-amber-400" />
                <span>Announcement Bar</span>
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                    Announcement Message
                  </label>
                  <textarea
                    rows={3}
                    value={announcementText}
                    onChange={(e) => setAnnouncementText(e.target.value)}
                    placeholder="Enter the announcement text that appears at the top of the site..."
                    className="w-full px-4 py-3 rounded-xl text-sm bg-white border border-gray-300 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-primary resize-none"
                  />
                  <p className="text-[10px] text-gray-500 mt-1">
                    Use emojis like 🎉 🚚 🔥 to make it eye-catching. Leave empty to hide the bar.
                  </p>
                </div>

                {/* Preview */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                    Live Preview
                  </label>
                  {announcementText ? (
                    <div className="bg-primary text-white text-center py-2.5 px-4 text-xs font-bold tracking-wider rounded-xl flex items-center justify-center gap-2 shadow-sm">
                      <div className="animate-pulse w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0"></div>
                      <span>{announcementText}</span>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500 italic text-sm border border-dashed border-gray-200 rounded-xl">
                      Announcement bar is hidden (empty message)
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <Button onClick={handleSaveAnnouncement}>
                    Save & Publish
                  </Button>
                  <Button variant="outline" onClick={handleClearAnnouncement}>
                    Clear Announcement
                  </Button>
                </div>

                <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 text-xs text-gray-400 space-y-1">
                  <p className="font-bold text-gray-300">Tips:</p>
                  <p>• Keep announcements short and impactful (1-2 sentences max).</p>
                  <p>• Mention active coupon codes so customers see them immediately.</p>
                  <p>• The bar appears at the very top of every page, above the navigation.</p>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* PRODUCT MODAL (Add/Edit) */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="relative w-full max-w-4xl bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-gray-200">
              <div>
                <h3 className="text-xl font-extrabold text-gray-900">
                  {editingProduct ? 'Edit Sanitaryware Product' : 'Add New Sanitaryware Product'}
                </h3>
                <p className="text-xs text-gray-500">
                  Configure base specifications, warranty, inventory, and multi-attribute product variants.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsProductModalOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleProductSubmit} className="space-y-6">
              {/* SECTION: Core Info */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  1. General Information & Identity
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <Input
                      label="Product Name"
                      type="text"
                      required
                      placeholder="e.g. Aura Wall-Mounted Luxury Basin Mixer"
                      value={productForm.name}
                      onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    />
                  </div>

                  <div>
                    <Input
                      label="Base SKU"
                      type="text"
                      placeholder="e.g. EBC-AURA-01"
                      value={productForm.sku}
                      onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                      Sanitary Category
                    </label>
                    <select
                      value={productForm.category_id}
                      onChange={(e) => setProductForm({ ...productForm, category_id: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl text-sm bg-white border border-gray-300 text-gray-900 focus:outline-none focus:border-primary"
                    >
                      <option value="">Select Category</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id} className="bg-white text-gray-900">
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Input
                      label="Brand"
                      type="text"
                      placeholder="Elite Bath Collections"
                      value={productForm.brand}
                      onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })}
                    />
                  </div>

                  <div>
                    <Input
                      label="Custom Slug (Optional)"
                      type="text"
                      placeholder="Auto-generated if empty"
                      value={productForm.slug}
                      onChange={(e) => setProductForm({ ...productForm, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                    />
                  </div>
                </div>
              </div>

              {/* SECTION: Specifications & Pricing */}
              <div className="space-y-4 pt-4 border-t border-gray-200">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  2. Pricing, Stock & Specifications
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Base Price (INR ₹)"
                    type="number"
                    required
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })}
                  />

                  <Input
                    label="Base Stock Quantity"
                    type="number"
                    required
                    value={productForm.stock}
                    onChange={(e) => setProductForm({ ...productForm, stock: Number(e.target.value) })}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input
                    label="Material"
                    type="text"
                    placeholder="e.g. Forged Solid Brass / Ceramic"
                    value={productForm.material}
                    onChange={(e) => setProductForm({ ...productForm, material: e.target.value })}
                  />

                  <Input
                    label="Base Finish"
                    type="text"
                    placeholder="e.g. Matte Black / Brushed Gold"
                    value={productForm.finish}
                    onChange={(e) => setProductForm({ ...productForm, finish: e.target.value })}
                  />

                  <Input
                    label="Warranty Info"
                    type="text"
                    placeholder="e.g. 10-Year Comprehensive Warranty"
                    value={productForm.warranty_info}
                    onChange={(e) => setProductForm({ ...productForm, warranty_info: e.target.value })}
                  />
                </div>

                {/* Badges and visibility */}
                <div className="flex flex-wrap items-center gap-6 p-3.5 bg-gray-50 rounded-xl border border-gray-200">
                  <label className="flex items-center space-x-2.5 cursor-pointer text-xs font-semibold uppercase tracking-wider text-gray-700">
                    <input
                      type="checkbox"
                      checked={productForm.featured}
                      onChange={(e) => setProductForm({ ...productForm, featured: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300 accent-primary"
                    />
                    <span>Featured Product</span>
                  </label>

                  <label className="flex items-center space-x-2.5 cursor-pointer text-xs font-semibold uppercase tracking-wider text-gray-700">
                    <input
                      type="checkbox"
                      checked={productForm.is_new_arrival}
                      onChange={(e) => setProductForm({ ...productForm, is_new_arrival: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300 accent-primary"
                    />
                    <span>New Arrival Badge</span>
                  </label>

                  <label className="flex items-center space-x-2.5 cursor-pointer text-xs font-semibold uppercase tracking-wider text-gray-700">
                    <input
                      type="checkbox"
                      checked={productForm.is_active}
                      onChange={(e) => setProductForm({ ...productForm, is_active: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300 accent-primary"
                    />
                    <span>Active (Publish in Store)</span>
                  </label>
                </div>
              </div>

              {/* SECTION: Media & Description */}
              <div className="space-y-5 pt-4 border-t border-gray-200">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  3. Imagery & Catalog Content (Supabase Storage Bucket)
                </h4>

                <ImageUploadZone
                  mode="single"
                  label="Main Product Image"
                  required
                  description="Upload primary high-resolution product photography to 'product-images/products/main'."
                  value={productForm.main_image_url}
                  onChange={(url) => setProductForm({ ...productForm, main_image_url: url })}
                  bucket="product-images"
                  folder="products/main"
                />

                <ImageUploadZone
                  mode="multiple"
                  label="Additional Product Gallery Images"
                  description="Upload multiple dimensional angles, close-ups, and installation shots."
                  values={
                    productForm.additional_images
                      ? productForm.additional_images.split(',').map((s) => s.trim()).filter(Boolean)
                      : []
                  }
                  onChange={(urls) => setProductForm({ ...productForm, additional_images: urls.join(', ') })}
                  bucket="product-images"
                  folder="products/gallery"
                />

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                    Detailed Product Description
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Write detailed specifications, engineering features, dimensions, water pressure requirements, and installation advice..."
                    value={productForm.description}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl text-sm bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary resize-none"
                  />
                </div>
              </div>

              {/* SECTION: Multi-Attribute Variant Architecture */}
              <ProductVariantEditor
                hasVariants={hasVariants}
                onHasVariantsChange={setHasVariants}
                options={optionDrafts}
                onOptionsChange={setOptionDrafts}
                variants={variantDrafts}
                onVariantsChange={setVariantDrafts}
                basePrice={Number(productForm.price) || 0}
                baseStock={Number(productForm.stock) || 0}
                baseSku={productForm.sku || ''}
                baseImageUrl={productForm.main_image_url || ''}
              />

              {/* Action Buttons */}
              <div className="flex gap-4 justify-end pt-6 border-t border-gray-200">
                <Button variant="outline" type="button" onClick={() => setIsProductModalOpen(false)} disabled={submittingProduct}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submittingProduct}>
                  {submittingProduct ? 'Saving...' : (editingProduct ? 'Update Product' : 'Create Product')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CATEGORY MODAL (Add/Edit) */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white border border-gray-200 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-6">
              {editingCategory ? 'Edit Category' : 'Add New Category'}
            </h3>

            <form onSubmit={handleCategorySubmit} className="space-y-5">
              <Input
                label="Category Name"
                type="text"
                required
                placeholder="e.g. Wall Decor"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
              />

              <ImageUploadZone
                mode="single"
                label="Category Image"
                required
                description="Upload category display image to 'product-images/categories'."
                value={categoryForm.image_url}
                onChange={(url) => setCategoryForm({ ...categoryForm, image_url: url })}
                bucket="product-images"
                folder="categories"
              />

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div>
                  <label className="text-sm font-semibold text-gray-900 block">Enable Size Selection</label>
                  <p className="text-xs text-gray-500 mt-1">Products in this category will require size selection (S, M, L, XL)</p>
                </div>
                <button
                  type="button"
                  onClick={() => setCategoryForm({ ...categoryForm, size_enabled: !categoryForm.size_enabled })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    categoryForm.size_enabled ? 'bg-primary' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      categoryForm.size_enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex gap-4 justify-end pt-4">
                <Button variant="outline" type="button" onClick={() => setIsCategoryModalOpen(false)} disabled={submittingCategory}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submittingCategory}>
                  {submittingCategory ? 'Saving...' : 'Submit'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}



      {/* COURIER TRACKING DETAILS MODAL */}
      {isTrackingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white border border-gray-200 rounded-2xl p-6 shadow-2xl">
            <button
              onClick={() => setIsTrackingModalOpen(false)}
              className="absolute top-4 right-4 p-2 bg-gray-100 text-gray-500 hover:text-gray-900 rounded-full border border-gray-300 focus:outline-none"
            >
              <X className="h-4 w-4" />
            </button>
            
            <h3 className="text-lg font-bold text-gray-900 mb-6">
              Enter Courier Tracking Details
            </h3>

            <form onSubmit={handleSaveTracking} className="space-y-5">
              <Input
                label="Courier Carrier"
                type="text"
                required
                placeholder="e.g. Delhivery, Blue Dart, DTDC, India Post"
                value={trackingCarrier}
                onChange={(e) => setTrackingCarrier(e.target.value)}
              />

              <Input
                label="Tracking Number / Waybill ID"
                type="text"
                required
                placeholder="e.g. 1234567890"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
              />

              <div className="flex gap-4 justify-end pt-4">
                <Button variant="outline" type="button" onClick={() => setIsTrackingModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Save & Update Status
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COUPON MODAL (Add/Edit) */}
      {isCouponModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white border border-gray-200 rounded-2xl p-6 shadow-2xl">
            <button
              onClick={() => {
                setIsCouponModalOpen(false);
                setEditingCoupon(null);
              }}
              className="absolute top-4 right-4 p-2 bg-gray-100 text-gray-500 hover:text-gray-900 rounded-full border border-gray-300 focus:outline-none"
            >
              <X className="h-4 w-4" />
            </button>
            
            <h3 className="text-lg font-bold text-gray-900 mb-6">
              {editingCoupon ? 'Edit Coupon' : 'Add New Coupon'}
            </h3>

            <form onSubmit={handleCouponSubmit} className="space-y-5">
              <Input
                label="Coupon Code"
                type="text"
                required
                disabled={!!editingCoupon}
                placeholder="e.g. DISCOUNT20"
                value={couponForm.code}
                onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
              />

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                  Coupon Type
                </label>
                <select
                  value={couponForm.type}
                  onChange={(e) => setCouponForm({ ...couponForm, type: e.target.value as 'PERCENT' | 'FIXED' })}
                  className="w-full px-4 py-2.5 rounded-lg text-sm bg-white border border-gray-300 text-gray-900 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  <option value="PERCENT">Percentage (%)</option>
                  <option value="FIXED">Fixed Amount (₹)</option>
                </select>
              </div>

              <Input
                label={couponForm.type === 'PERCENT' ? 'Discount Percentage (%)' : 'Discount Amount (₹)'}
                type="number"
                required
                min={1}
                max={couponForm.type === 'PERCENT' ? 100 : undefined}
                value={couponForm.value}
                onChange={(e) => setCouponForm({ ...couponForm, value: Number(e.target.value) })}
              />

              <Input
                label="Minimum Order Subtotal (₹)"
                type="number"
                min={0}
                value={couponForm.minOrder}
                onChange={(e) => setCouponForm({ ...couponForm, minOrder: Number(e.target.value) })}
              />

              <div className="flex items-center space-x-3 pt-2">
                <input
                  type="checkbox"
                  id="couponActiveCheckbox"
                  checked={couponForm.active}
                  onChange={(e) => setCouponForm({ ...couponForm, active: e.target.checked })}
                  className="h-4.5 w-4.5 rounded border-gray-200 accent-primary"
                />
                <label htmlFor="couponActiveCheckbox" className="text-xs font-semibold uppercase tracking-wider text-gray-400 cursor-pointer">
                  Coupon Active
                </label>
              </div>

              <div className="flex gap-4 justify-end pt-4">
                <Button variant="outline" type="button" onClick={() => {
                  setIsCouponModalOpen(false);
                  setEditingCoupon(null);
                }}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingCoupon ? 'Save Changes' : 'Create Coupon'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PACKING SLIP & DISPATCH INVOICE MODAL */}
      {selectedPackingSlipOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/70 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-3xl bg-white border border-gray-200 rounded-2xl shadow-2xl my-8 overflow-hidden">
            {/* Modal Controls (Hidden in Print) */}
            <div className="no-print flex items-center justify-between px-6 py-4 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <Printer className="h-5 w-5 text-primary" />
                <h3 className="text-base font-bold text-gray-900">Luxury Packing Slip & Dispatch Invoice</h3>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={() => window.print()} className="flex items-center gap-1.5">
                  <Printer className="h-4 w-4" /> Print Document
                </Button>
                <button
                  onClick={() => setSelectedPackingSlipOrder(null)}
                  className="p-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
                >
                  <CloseIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Printable Document Body */}
            <div id="printable-packing-slip" className="p-8 space-y-6 text-gray-900 bg-white">
              {/* Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start border-b border-gray-200 pb-6 gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <img src="/logo.png" alt="Elite Bath Collections" className="h-10 w-auto object-contain" onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
                    <h1 className="text-2xl font-black tracking-tight text-gray-900 uppercase">Elite Bath Collections</h1>
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-primary mt-1">Luxury Sanitaryware & Architectural Bathroom Fittings</p>
                  <p className="text-xs text-gray-500 mt-1">DLF Cyber City, Phase III, Gurugram, Haryana 122002 • care@elitebathcollections.com</p>
                </div>
                <div className="text-right sm:text-right">
                  <span className="inline-block px-3 py-1 rounded bg-primary/10 border border-primary/20 text-primary text-xs font-extrabold uppercase tracking-wider mb-2">
                    Packing Slip & Tax Invoice
                  </span>
                  <p className="text-xs text-gray-500 font-mono">Order ID: #{selectedPackingSlipOrder.id}</p>
                  <p className="text-xs text-gray-500">Date: {new Date(selectedPackingSlipOrder.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                </div>
              </div>

              {/* Two Column Address & Logistics Block */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-gray-50 p-4 rounded-xl border border-gray-200 text-xs">
                <div>
                  <h4 className="font-bold uppercase tracking-wider text-gray-400 mb-2 text-[11px]">Deliver To:</h4>
                  <p className="font-extrabold text-sm text-gray-900">{selectedPackingSlipOrder.shipping_address?.fullName}</p>
                  <p className="text-gray-700 mt-0.5">{selectedPackingSlipOrder.shipping_address?.phone} • {selectedPackingSlipOrder.shipping_address?.email}</p>
                  <p className="text-gray-700 mt-1">{selectedPackingSlipOrder.shipping_address?.address}</p>
                  {selectedPackingSlipOrder.shipping_address?.landmark && (
                    <p className="text-gray-500 italic text-[11px]">Landmark: {selectedPackingSlipOrder.shipping_address.landmark}</p>
                  )}
                  <p className="text-gray-900 font-bold mt-1">
                    {selectedPackingSlipOrder.shipping_address?.city}, {selectedPackingSlipOrder.shipping_address?.state} - {selectedPackingSlipOrder.shipping_address?.pincode}
                  </p>
                </div>
                <div className="space-y-1.5 border-t sm:border-t-0 sm:border-l border-gray-200 pt-3 sm:pt-0 sm:pl-6">
                  <h4 className="font-bold uppercase tracking-wider text-gray-400 mb-2 text-[11px]">Fulfillment Details:</h4>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Order Status:</span>
                    <span className="font-bold text-gray-900">{selectedPackingSlipOrder.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Payment Status:</span>
                    <span className="font-bold text-emerald-700">{selectedPackingSlipOrder.payment_status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Payment Method:</span>
                    <span className="font-semibold text-gray-900">{selectedPackingSlipOrder.shipping_address?.paymentMethod || 'Prepaid'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Carrier / Courier:</span>
                    <span className="font-semibold text-gray-900">{selectedPackingSlipOrder.shipping_address?.tracking_info?.carrier || 'Delhivery Express'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tracking / AWB #:</span>
                    <span className="font-mono font-bold text-gray-900">{selectedPackingSlipOrder.shipping_address?.tracking_info?.tracking_number || 'Pending Dispatch'}</span>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="overflow-x-auto border border-gray-200 rounded-xl">
                <table className="w-full text-left text-xs text-gray-600">
                  <thead className="bg-gray-100 text-gray-700 font-bold uppercase text-[10px] border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3">#</th>
                      <th className="px-4 py-3">Item Description</th>
                      <th className="px-4 py-3">Variant / Option</th>
                      <th className="px-4 py-3">SKU</th>
                      <th className="px-4 py-3 text-center">Qty</th>
                      <th className="px-4 py-3 text-right">Price</th>
                      <th className="px-4 py-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {selectedPackingSlipOrder.items?.map((item, idx) => (
                      <tr key={item.id || idx}>
                        <td className="px-4 py-3 font-bold text-gray-400">{idx + 1}</td>
                        <td className="px-4 py-3 font-semibold text-gray-900 max-w-[200px]">
                          {item.product?.name || (item as any).product_name || 'Sanitaryware Fitting'}
                        </td>
                        <td className="px-4 py-3">
                          {item.selected_variant ? (
                            <span className="font-medium text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                              {item.selected_variant}
                            </span>
                          ) : (
                            <span className="text-gray-400 italic">Standard</span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono text-gray-500 text-[11px]">
                          {item.variant?.sku || item.product?.sku || 'EBC-SAN'}
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-gray-900">{item.quantity}</td>
                        <td className="px-4 py-3 text-right text-gray-700">₹{item.price?.toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3 text-right font-bold text-gray-900">₹{(item.price * item.quantity).toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Price Calculation Summary */}
              <div className="flex justify-end pt-2">
                <div className="w-full sm:w-64 space-y-2 text-xs">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal:</span>
                    <span>₹{selectedPackingSlipOrder.total_amount?.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Insured Wooden Crate Freight:</span>
                    <span className="text-emerald-700 font-bold">FREE</span>
                  </div>
                  <div className="flex justify-between text-base font-extrabold text-gray-900 border-t border-gray-200 pt-2">
                    <span>Grand Total:</span>
                    <span className="text-primary">₹{selectedPackingSlipOrder.total_amount?.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Quality & Dispatch Signoff */}
              <div className="border-t border-gray-200 pt-4 text-[10px] text-gray-500 flex flex-col sm:flex-row justify-between gap-4">
                <div>
                  <p className="font-semibold text-gray-700">Quality Inspection Certificate:</p>
                  <p>All sanitary fittings are pressure-tested and inspected for zero ceramic defects prior to packing.</p>
                </div>
                <div className="text-right sm:text-right">
                  <p className="font-semibold text-gray-700">Authorized Signatory</p>
                  <p className="mt-4 text-gray-400">Elite Bath Logistics Team</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
        </div>
      </main>
    </div>
  );
};

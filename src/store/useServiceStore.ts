import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { ServiceItem, ServiceBooking, ServiceBookingStatus } from '../types/services';

const DEFAULT_SERVICES: ServiceItem[] = [
  {
    id: 'srv-fitting',
    title: 'Certified Fitting & Installation Service',
    short_description: 'Precision mounting of faucets, showers, vanities and pressure testing by master technicians.',
    description: 'Our licensed plumbing specialists handle full-suite installation using precision torque calibration, high-grade PTFE seals, and zero-leak pressure testing. Backed by a 90-day installation warranty.',
    price: 799,
    category: 'Fitting',
    estimated_duration: '1.5 - 2 Hours',
    features: [
      'Precision brass & ceramic cartridge alignment',
      'Hydraulic leak & pressure stability check',
      'Free protective pipe thread seals & teflon',
      '90-day post-installation guarantee'
    ],
    is_active: true,
    is_checkout_addon: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'srv-agent',
    title: 'Dedicated Service Agent & Layout Consultation',
    short_description: 'On-site measurement, water pressure evaluation, and custom architectural bathroom consultation.',
    description: 'A certified Elite Bath technical consultant visits your site to verify inlet-outlet dimensions, measure tile clearances, test municipal water pressure, and ensure seamless fittings compatibility before delivery.',
    price: 499,
    category: 'Inspection',
    estimated_duration: '45 - 60 Mins',
    features: [
      'Center-to-center pipe dimension verification',
      'Water pressure gauge reading (bar/PSI)',
      'Product compatibility & clearance report',
      'Dedicated WhatsApp support with technical manager'
    ],
    is_active: true,
    is_checkout_addon: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'srv-descaling',
    title: 'Ceramic Glaze & Cartridge Descaling Maintenance',
    short_description: 'Eco-mineral descaling, aerator cleaning, and ceramic glaze revitalization for high-end fittings.',
    description: 'Restore water flow and lustrous PVD finish. Includes ultrasonic aerator cleaning, silicone seal conditioning, and deep mineral descaling designed for hard-water Indian regions.',
    price: 1299,
    category: 'Maintenance',
    estimated_duration: '2 - 3 Hours',
    features: [
      'Ultrasonic faucet aerator deep clean',
      'PVD finish anti-scratch polishing',
      'Silicon O-ring lubrication & seal replacement',
      'Showerhead silicone nozzle calcium purge'
    ],
    is_active: true,
    is_checkout_addon: false,
    created_at: new Date().toISOString()
  },
  {
    id: 'srv-disposal',
    title: 'Safe Removal & Old Fixture Disposal',
    short_description: 'Careful uninstallation of old commodes/basins and eco-friendly debris removal.',
    description: 'Hassle-free decommissioning of existing sanitaryware without damaging surrounding wall tiles or subfloor plumbing, complete with clean disposal.',
    price: 599,
    category: 'Fitting',
    estimated_duration: '1 Hour',
    features: [
      'Tile-safe non-destructive uninstallation',
      'Wall anchor patching and inlet capping',
      'Responsible municipal disposal & haul-away'
    ],
    is_active: true,
    is_checkout_addon: true,
    created_at: new Date().toISOString()
  }
];

interface ServiceState {
  services: ServiceItem[];
  bookings: ServiceBooking[];
  loading: boolean;
  initializeServices: () => Promise<void>;
  addService: (service: Omit<ServiceItem, 'id' | 'created_at'>) => Promise<void>;
  updateService: (id: string, updates: Partial<ServiceItem>) => Promise<void>;
  toggleServiceStatus: (id: string) => Promise<void>;
  deleteService: (id: string) => Promise<void>;
  createBooking: (booking: Omit<ServiceBooking, 'id' | 'created_at' | 'status'>) => Promise<ServiceBooking>;
  updateBookingStatus: (id: string, status: ServiceBookingStatus) => Promise<void>;
}

export const useServiceStore = create<ServiceState>((set, get) => ({
  services: (() => {
    try {
      const cached = localStorage.getItem('elitebath_services');
      return cached ? JSON.parse(cached) : DEFAULT_SERVICES;
    } catch {
      return DEFAULT_SERVICES;
    }
  })(),
  bookings: (() => {
    try {
      const cached = localStorage.getItem('elitebath_service_bookings');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  })(),
  loading: false,

  initializeServices: async () => {
    set({ loading: true });
    try {
      // 1. Try fetching live services from Supabase
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('created_at', { ascending: true });

      if (!error && data && data.length > 0) {
        const formattedServices: ServiceItem[] = data.map((item: any) => ({
          id: item.id,
          title: item.title,
          short_description: item.short_description || item.description,
          description: item.description,
          price: Number(item.price ?? 0),
          category: item.category,
          estimated_duration: item.estimated_duration,
          features: Array.isArray(item.features)
            ? item.features
            : typeof item.features === 'string'
            ? JSON.parse(item.features || '[]')
            : [],
          icon_name: item.icon_name,
          image_url: item.image_url,
          is_active: Boolean(item.is_active),
          is_checkout_addon: item.is_checkout_addon ?? (item.category === 'Fitting' || item.category === 'Inspection'),
          created_at: item.created_at
        }));

        set({ services: formattedServices });
        localStorage.setItem('elitebath_services', JSON.stringify(formattedServices));
      } else {
        // Use cached or fallback
        const existing = localStorage.getItem('elitebath_services');
        if (!existing) {
          localStorage.setItem('elitebath_services', JSON.stringify(DEFAULT_SERVICES));
          set({ services: DEFAULT_SERVICES });
        }
      }

      // Fetch bookings if available
      const { data: dbBookings, error: bError } = await supabase
        .from('service_bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (!bError && dbBookings) {
        set({ bookings: dbBookings });
        localStorage.setItem('elitebath_service_bookings', JSON.stringify(dbBookings));
      }
    } catch (err) {
      console.warn('Services initialization fallback to local storage:', err);
    } finally {
      set({ loading: false });
    }
  },

  addService: async (serviceData) => {
    const newService: ServiceItem = {
      ...serviceData,
      price: Number(serviceData.price ?? 0),
      id: `srv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      created_at: new Date().toISOString()
    };

    try {
      await supabase.from('services').insert([newService]);
    } catch (err) {
      console.warn('Supabase service insert failed, saved locally:', err);
    }

    const updated = [...get().services, newService];
    set({ services: updated });
    localStorage.setItem('elitebath_services', JSON.stringify(updated));

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('elitebath_services_updated'));
    }
  },

  updateService: async (id, updates) => {
    const formattedUpdates = {
      ...updates,
      ...(updates.price !== undefined ? { price: Number(updates.price) } : {})
    };

    try {
      await supabase.from('services').update(formattedUpdates).eq('id', id);
    } catch (err) {
      console.warn('Supabase service update failed, saved locally:', err);
    }

    const updated = get().services.map((s) => (s.id === id ? { ...s, ...formattedUpdates } : s));
    set({ services: updated });
    localStorage.setItem('elitebath_services', JSON.stringify(updated));

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('elitebath_services_updated'));
    }
  },

  toggleServiceStatus: async (id) => {
    const service = get().services.find((s) => s.id === id);
    if (!service) return;
    const newStatus = !service.is_active;
    await get().updateService(id, { is_active: newStatus });
  },

  deleteService: async (id) => {
    try {
      await supabase.from('services').delete().eq('id', id);
    } catch (err) {
      console.warn('Supabase service delete failed, removed locally:', err);
    }

    const updated = get().services.filter((s) => s.id !== id);
    set({ services: updated });
    localStorage.setItem('elitebath_services', JSON.stringify(updated));
  },

  createBooking: async (bookingData) => {
    const newBooking: ServiceBooking = {
      ...bookingData,
      id: `EB-SRV-${Math.floor(100000 + Math.random() * 900000)}`,
      status: 'PENDING',
      created_at: new Date().toISOString()
    };

    try {
      await supabase.from('service_bookings').insert([newBooking]);
    } catch (err) {
      console.warn('Supabase service booking insert failed, saved locally:', err);
    }

    const updated = [newBooking, ...get().bookings];
    set({ bookings: updated });
    localStorage.setItem('elitebath_service_bookings', JSON.stringify(updated));
    return newBooking;
  },

  updateBookingStatus: async (id, status) => {
    try {
      await supabase.from('service_bookings').update({ status }).eq('id', id);
    } catch (err) {
      console.warn('Supabase booking status update failed, updated locally:', err);
    }

    const updated = get().bookings.map((b) => (b.id === id ? { ...b, status } : b));
    set({ bookings: updated });
    localStorage.setItem('elitebath_service_bookings', JSON.stringify(updated));
  }
}));

// Cross-tab and window synchronization
if (typeof window !== 'undefined') {
  const syncFromStorage = () => {
    try {
      const cached = localStorage.getItem('elitebath_services');
      if (cached) {
        useServiceStore.setState({ services: JSON.parse(cached) });
      }
    } catch {
      // ignore
    }
  };

  window.addEventListener('storage', (e) => {
    if (e.key === 'elitebath_services') {
      syncFromStorage();
    }
  });

  window.addEventListener('elitebath_services_updated', syncFromStorage);
}

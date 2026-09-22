import React, { useState } from 'react';
import { 
  Wrench, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  MessageCircle, 
  X, 
  Sparkles,
  Award,
  ChevronRight
} from 'lucide-react';
import { useServiceStore } from '../store/useServiceStore';
import type { ServiceItem } from '../types/services';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { checkRateLimit, recordRateLimitAttempt } from '../lib/rateLimiter';

export const Services: React.FC = () => {
  const { services, createBooking } = useServiceStore();
  const activeServices = services.filter((s) => s.is_active);

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeModalService, setActiveModalService] = useState<ServiceItem | null>(null);

  // Booking Form State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('Morning (10 AM - 1 PM)');
  const [notes, setNotes] = useState('');

  const [bookingLoading, setBookingLoading] = useState(false);
  const [confirmedBookingId, setConfirmedBookingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const filteredServices = selectedCategory === 'All'
    ? activeServices
    : activeServices.filter((s) => s.category === selectedCategory);

  const handleOpenBooking = (service: ServiceItem) => {
    setActiveModalService(service);
    setConfirmedBookingId(null);
    setErrorMsg('');
  };

  const handleCloseModal = () => {
    setActiveModalService(null);
    setConfirmedBookingId(null);
    setErrorMsg('');
  };

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModalService) return;

    // Rate limiting abuse prevention
    const rateCheck = checkRateLimit('service_booking', {
      maxRequests: 4,
      windowSeconds: 60,
      actionName: 'service bookings',
    });
    if (!rateCheck.allowed) {
      setErrorMsg(rateCheck.errorMessage || 'Too many booking requests. Please wait a moment.');
      return;
    }
    recordRateLimitAttempt('service_booking', { maxRequests: 4, windowSeconds: 60 });

    if (!customerName.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (customerPhone.trim().length < 10) {
      setErrorMsg('Please enter a valid 10-digit phone number.');
      return;
    }
    if (!address.trim() || !city.trim() || pincode.trim().length !== 6) {
      setErrorMsg('Please enter a complete address with valid 6-digit pincode.');
      return;
    }
    if (!preferredDate) {
      setErrorMsg('Please select a preferred service date.');
      return;
    }

    setBookingLoading(true);
    setErrorMsg('');

    try {
      const newBooking = await createBooking({
        service_id: activeModalService.id,
        service_title: activeModalService.title,
        service_price: activeModalService.price,
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        customer_email: customerEmail.trim() || 'customer@example.com',
        address: address.trim(),
        city: city.trim(),
        pincode: pincode.trim(),
        preferred_date: preferredDate,
        preferred_time_slot: preferredTime,
        notes: notes.trim()
      });

      setConfirmedBookingId(newBooking.id);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit service booking. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleWhatsAppCoordinate = () => {
    if (!activeModalService || !confirmedBookingId) return;

    const message = encodeURIComponent(
      `Hello Elite Bath Services Team!\n\n` +
      `I have booked a service via the website:\n` +
      `📌 Booking ID: ${confirmedBookingId}\n` +
      `🛠️ Service: ${activeModalService.title}\n` +
      `💵 Price: ₹${activeModalService.price.toLocaleString('en-IN')}\n` +
      `👤 Customer: ${customerName}\n` +
      `📞 Phone: ${customerPhone}\n` +
      `📍 Location: ${address}, ${city} - ${pincode}\n` +
      `📅 Preferred Date: ${preferredDate} (${preferredTime})\n\n` +
      `Please confirm the technician appointment.`
    );

    window.open(`https://wa.me/917055435358?text=${message}`, '_blank');
  };

  return (
    <div className="bg-white min-h-screen pb-20">
      {/* Hero Header */}
      <section className="relative bg-gradient-to-b from-primary/5 via-white to-white border-b border-gray-200 py-16 sm:py-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider">
            <Wrench className="h-3.5 w-3.5" />
            <span>Master Plumbers & Architectural Technical Support</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-gray-900 tracking-tight max-w-3xl mx-auto">
            Professional Sanitaryware & Fitting Services
          </h1>

          <p className="text-gray-600 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Ensure long-term performance, proper water pressure, and zero leaks with certified installation, pre-delivery layout consultation, and deep descaling maintenance.
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-6 text-xs text-gray-700 font-medium">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span>90-Day Service Guarantee</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-primary" />
              <span>Certified Master Plumbers</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <span>On-Time Arrival Promise</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Category Filters */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
          {['All', 'Fitting', 'Inspection', 'Maintenance'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                selectedCategory === cat
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cat === 'All' ? 'All Services' : cat}
            </button>
          ))}
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filteredServices.map((service) => (
            <div
              key={service.id}
              className="bg-white rounded-2xl border border-gray-200 hover:border-primary/50 transition-all duration-300 shadow-sm hover:shadow-md flex flex-col overflow-hidden group"
            >
              <div className="p-6 flex-grow space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <span className="px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                    {service.category}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-gray-500 font-medium">
                    <Clock className="h-3.5 w-3.5 text-gray-400" />
                    <span>{service.estimated_duration}</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary transition-colors leading-snug">
                    {service.title}
                  </h3>
                  <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                    {service.short_description}
                  </p>
                </div>

                {/* Features List */}
                <ul className="space-y-2 pt-2 border-t border-gray-100">
                  {service.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-gray-700">
                      <CheckCircle2 className="h-3.5 w-3.5 text-primary flex-shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Card Footer with Price & Actions */}
              <div className="p-6 bg-gray-50/70 border-t border-gray-100 flex items-center justify-between gap-4 mt-auto">
                <div>
                  <span className="text-[10px] text-gray-500 block uppercase font-bold tracking-wider">
                    Service Fee
                  </span>
                  <span className="text-xl font-extrabold text-gray-900">
                    ₹{service.price.toLocaleString('en-IN')}
                  </span>
                </div>

                <Button
                  onClick={() => handleOpenBooking(service)}
                  size="sm"
                  className="px-5 font-bold shadow-xs hover:shadow-sm"
                >
                  <span>Book Service</span>
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Trade & Custom Consultation Banner */}
        <div className="mt-16 bg-gradient-to-r from-slate-900 via-primary-dark to-slate-900 text-white rounded-3xl p-8 sm:p-12 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="h-4 w-4" />
              <span>Architects & Luxury Villa Projects</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Need Comprehensive On-Site Plumbing Coordination?
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm max-w-xl leading-relaxed">
              For complete residence renovations or commercial projects, our master plumbing engineer provides end-to-end layout drawings, pipe pressure calculations, and certified installation oversight.
            </p>
          </div>

          <a
            href="https://wa.me/917055435358?text=Hello%20Elite%20Bath%20Services!%20I%20would%20like%20to%20inquire%20about%20site%20plumbing%20coordination%20for%20my%20residence/project."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg hover:scale-105 transition-all flex-shrink-0"
          >
            <MessageCircle className="h-5 w-5" />
            <span>Chat on WhatsApp</span>
          </a>
        </div>
      </div>

      {/* Interactive Booking Modal */}
      {activeModalService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-6 bg-primary text-white relative flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-200">
                  Book Appointment
                </span>
                <h3 className="text-lg font-bold text-white mt-0.5">
                  {activeModalService.title}
                </h3>
                <p className="text-xs text-white/80 mt-1">
                  Service Fee: ₹{activeModalService.price.toLocaleString('en-IN')} (Payable on completion)
                </p>
              </div>

              <button
                onClick={handleCloseModal}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                title="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4">
              {confirmedBookingId ? (
                /* Success State */
                <div className="text-center py-6 space-y-4">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-xl font-extrabold text-gray-900">
                      Booking Confirmed!
                    </h4>
                    <p className="text-xs text-gray-600 max-w-sm mx-auto">
                      Your service request has been logged under ID:
                    </p>
                    <p className="font-mono text-base font-bold text-primary select-all">
                      {confirmedBookingId}
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4 text-left text-xs space-y-2 border border-gray-200">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Service:</span>
                      <span className="font-semibold text-gray-900">{activeModalService.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Preferred Date:</span>
                      <span className="font-semibold text-gray-900">{preferredDate} ({preferredTime})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Location:</span>
                      <span className="font-semibold text-gray-900 truncate max-w-[200px]">{city} - {pincode}</span>
                    </div>
                  </div>

                  {/* Immediate WhatsApp Coordination Action */}
                  <div className="pt-2 space-y-3">
                    <button
                      onClick={handleWhatsAppCoordinate}
                      className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md hover:scale-[1.01] transition-all"
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span>Coordinate Technician via WhatsApp</span>
                    </button>

                    <Button
                      variant="outline"
                      fullWidth
                      onClick={handleCloseModal}
                    >
                      Done
                    </Button>
                  </div>
                </div>
              ) : (
                /* Booking Input Form */
                <form onSubmit={handleSubmitBooking} className="space-y-4">
                  {errorMsg && (
                    <div className="p-3 rounded-lg text-xs font-semibold bg-danger/10 text-danger border border-danger/20">
                      {errorMsg}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      label="Full Name *"
                      required
                      placeholder="e.g. Rajesh Mehra"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                    />
                    <Input
                      label="Phone Number *"
                      required
                      type="tel"
                      placeholder="e.g. 9876543210"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                    />
                  </div>

                  <Input
                    label="Email Address"
                    type="email"
                    placeholder="e.g. name@example.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                  />

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-700">Service Address *</label>
                    <input
                      type="text"
                      required
                      placeholder="House/Plot no., Street, Area"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-xs text-gray-900 focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="City *"
                      required
                      placeholder="e.g. Hapur / Delhi"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                    />
                    <Input
                      label="6-Digit Pincode *"
                      required
                      maxLength={6}
                      placeholder="e.g. 245101"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-700">Preferred Date *</label>
                      <input
                        type="date"
                        required
                        min={new Date().toISOString().split('T')[0]}
                        value={preferredDate}
                        onChange={(e) => setPreferredDate(e.target.value)}
                        className="w-full bg-white border border-gray-300 rounded-lg p-2 text-xs text-gray-900 focus:outline-none focus:border-primary"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-700">Time Slot</label>
                      <select
                        value={preferredTime}
                        onChange={(e) => setPreferredTime(e.target.value)}
                        className="w-full bg-white border border-gray-300 rounded-lg p-2 text-xs text-gray-900 focus:outline-none focus:border-primary"
                      >
                        <option>Morning (10 AM - 1 PM)</option>
                        <option>Afternoon (1 PM - 4 PM)</option>
                        <option>Evening (4 PM - 7 PM)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-700">Special Plumbing Notes (Optional)</label>
                    <textarea
                      rows={2}
                      placeholder="e.g. 3 concealed valves need replacement, ceiling rain shower connection..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded-lg p-2 text-xs text-gray-900 focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div className="pt-2">
                    <Button
                      type="submit"
                      fullWidth
                      loading={bookingLoading}
                      className="py-3 font-bold text-xs"
                    >
                      Confirm Booking & Coordinate
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

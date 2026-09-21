import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Mail, Send, Check, Phone, MapPin, Clock, Building } from 'lucide-react';

export const Contact: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [inquiryType, setInquiryType] = useState('GENERAL');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;

    setLoading(true);
    try {
      const fullMessageContent = `[Inquiry Type: ${inquiryType}] ${phone ? `[Phone: ${phone}] ` : ''}${message.trim()}`;
      const { error } = await supabase
        .from('contact_messages')
        .insert({
          name: name.trim(),
          email: email.trim(),
          message: fullMessageContent,
        });

      if (error) throw error;
      setSuccess(true);
      setName('');
      setEmail('');
      setPhone('');
      setInquiryType('GENERAL');
      setMessage('');
    } catch (err) {
      console.error('Error submitting contact message:', err);
      setSuccess(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Header */}
      <div className="text-center space-y-3 mb-12">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider">
          <Building className="h-3.5 w-3.5" />
          <span>Client Concierge & Trade Support</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900">
          Connect With Elite Bath Collections
        </h1>
        <p className="text-gray-600 text-sm sm:text-base max-w-xl mx-auto">
          Whether planning an architect-designed villa, seeking technical plumbing specifications, or requesting finish samples, our luxury concierges are at your service.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-stretch">
        {/* Left Information Card */}
        <div className="md:col-span-5 bg-gray-50 border border-gray-200 p-8 rounded-2xl flex flex-col justify-between space-y-8 shadow-sm">
          <div>
            <h2 className="text-xl font-extrabold text-gray-900">Corporate Showroom & Concierge</h2>
            <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
              Experience our tactile PVD finishes, precision ceramic cartridges, and freestanding baths in person or schedule a virtual walkthrough.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-start space-x-3 text-xs text-gray-700">
              <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <strong className="block text-gray-900 font-bold">Showroom & Experience Center</strong>
                <span>Under pass flyover, Buxar, Distt. Hapur, Uttar Pradesh</span>
              </div>
            </div>

            <div className="flex items-start space-x-3 text-xs text-gray-700">
              <Phone className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <div className="space-y-1.5">
                <strong className="block text-gray-900 font-bold">Direct Phone & WhatsApp Support</strong>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <a href="tel:+917055435358" className="font-semibold text-primary hover:underline">+91 70554 35358</a>
                    <span className="text-gray-300">|</span>
                    <a href="https://wa.me/917055435358" target="_blank" rel="noopener noreferrer" className="text-[11px] text-emerald-600 hover:underline font-medium">WhatsApp</a>
                  </div>
                  <div className="flex items-center gap-2">
                    <a href="tel:+919084339649" className="font-semibold text-primary hover:underline">+91 90843 39649</a>
                    <span className="text-gray-300">|</span>
                    <a href="https://wa.me/919084339649" target="_blank" rel="noopener noreferrer" className="text-[11px] text-emerald-600 hover:underline font-medium">WhatsApp</a>
                  </div>
                  <div className="flex items-center gap-2">
                    <a href="tel:+916399525356" className="font-semibold text-primary hover:underline">+91 63995 25356</a>
                    <span className="text-gray-300">|</span>
                    <a href="https://wa.me/916399525356" target="_blank" rel="noopener noreferrer" className="text-[11px] text-emerald-600 hover:underline font-medium">WhatsApp</a>
                  </div>
                </div>
                <span className="text-gray-400 block text-[11px] pt-0.5">Mon – Sat, 9:00 AM – 8:00 PM IST</span>
              </div>
            </div>

            <div className="flex items-start space-x-3 text-xs text-gray-700">
              <Mail className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <strong className="block text-gray-900 font-bold">Email Inquiries & Orders</strong>
                <a href="mailto:muhammad1211junaid@gmail.com" className="hover:text-primary transition-colors block font-semibold text-primary break-all">
                  muhammad1211junaid@gmail.com
                </a>
                <span className="text-gray-400 block text-[11px] mt-0.5">24/7 client concierge support</span>
              </div>
            </div>

            <div className="flex items-start space-x-3 text-xs text-gray-700">
              <Clock className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <strong className="block text-gray-900 font-bold">Guaranteed Response</strong>
                <span>Technical plumbing and quote responses within 12-24 business hours.</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-white border border-gray-200 rounded-xl text-[11px] text-gray-500 leading-relaxed">
            <strong className="text-gray-800 block mb-1">Architects & Interior Designers:</strong>
            Mention your project square footage or CAD rough-in schedule in your message for dedicated trade discount schedules.
          </div>
        </div>

        {/* Right Form Card */}
        <div className="md:col-span-7 bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
          {success ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-12">
              <div className="w-14 h-14 bg-success/10 border border-success/20 rounded-full flex items-center justify-center text-success">
                <Check className="h-7 w-7" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Message Received</h2>
              <p className="text-sm text-gray-600 max-w-sm leading-relaxed">
                Thank you for contacting Elite Bath Collections. A specialized architectural concierge will review your inquiry and connect with you shortly.
              </p>
              <Button size="sm" onClick={() => setSuccess(false)}>Send Another Message</Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  type="text"
                  required
                  placeholder="Rohan Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />

                <Input
                  label="Email Address"
                  type="email"
                  required
                  placeholder="rohan.sharma@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Contact Phone"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
                    Inquiry Type
                  </label>
                  <select
                    value={inquiryType}
                    onChange={(e) => setInquiryType(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg text-sm bg-white border border-gray-300 text-gray-900 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="GENERAL">General Product Inquiry</option>
                    <option value="ARCHITECTURAL">Architectural & Bulk Project Order</option>
                    <option value="TECHNICAL">Technical Plumbing & Pressure Specs</option>
                    <option value="ORDER_STATUS">Order Status & Tracking</option>
                    <option value="WARRANTY">Warranty & Replacement Claim</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
                  Message Details
                </label>
                <textarea
                  rows={5}
                  required
                  placeholder="Please describe your requirements, project details, or order ID..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm border border-gray-300 placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none text-gray-900"
                />
              </div>

              <Button type="submit" fullWidth loading={loading}>
                <Send className="mr-2 h-4 w-4" />
                Submit Inquiry to Concierge
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

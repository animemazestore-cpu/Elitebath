import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Heart, Search, User, Menu, X, ShieldAlert, LogOut, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useCartStore } from '../../store/useCartStore';
import { useWishlistStore } from '../../store/useWishlistStore';
import { useCatalogStore } from '../../store/useCatalogStore';
import { supabase } from '../../lib/supabase';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuthStore();
  const cartItems = useCartStore((state) => state.getTotalItems());
  const wishlistCount = useWishlistStore((state) => state.items.length);
  const products = useCatalogStore((state) => state.products);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);

  // Instant search results matching name, description, category, finish, brand, material
  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];
    return products.filter((p) => {
      const nameMatch = p.name?.toLowerCase().includes(query);
      const descMatch = p.description?.toLowerCase().includes(query);
      const catMatch = p.category?.name?.toLowerCase().includes(query);
      const finishMatch = p.finish?.toLowerCase().includes(query);
      const brandMatch = p.brand?.toLowerCase().includes(query);
      const materialMatch = p.material?.toLowerCase().includes(query);
      return nameMatch || descMatch || catMatch || finishMatch || brandMatch || materialMatch;
    }).slice(0, 6);
  }, [products, searchQuery]);

  // Handle clicking outside or pressing Escape to close search dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickedDesktop = searchContainerRef.current?.contains(target);
      const clickedMobile = mobileSearchRef.current?.contains(target);
      if (!clickedDesktop && !clickedMobile) {
        setIsSearchFocused(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsSearchFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const DEFAULT_ANNOUNCEMENT = '✨ Exclusive Offer: Use code ELITE10 for 10% discount! 🚚 FREE Shipping on sanitaryware above ₹999!';

  const [announcement, setAnnouncement] = useState(() => {
    return localStorage.getItem('elitebath_announcement') || localStorage.getItem('animemaze_announcement') || DEFAULT_ANNOUNCEMENT;
  });

  // Fetch announcement from DB on mount — DB is source of truth
  useEffect(() => {
    const fetchAnnouncement = async () => {
      try {
        const { data, error } = await supabase
          .from('site_announcements')
          .select('message')
          .eq('active', true)
          .order('created_at', { ascending: false })
          .limit(1);

        if (!error && data && data.length > 0) {
          setAnnouncement(data[0].message);
          localStorage.setItem('elitebath_announcement', data[0].message);
        }
      } catch (err) {
        console.warn('Could not load announcement from DB, using fallback:', err);
      }
    };
    fetchAnnouncement();
  }, []);

  // Listen for admin updates fired from the same tab
  useEffect(() => {
    const handleStorageChange = () => {
      setAnnouncement(localStorage.getItem('elitebath_announcement') || localStorage.getItem('animemaze_announcement') || DEFAULT_ANNOUNCEMENT);
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('announcement_updated', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('announcement_updated', handleStorageChange);
    };
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setIsSearchFocused(false);
      setIsMobileMenuOpen(false);
    }
  };

  const handleSelectProduct = (slug: string) => {
    navigate(`/product/${slug}`);
    setSearchQuery('');
    setIsSearchFocused(false);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {announcement && (
        <div className="bg-primary text-white py-2 px-4 text-xs font-bold tracking-wider relative overflow-hidden shadow-sm z-50 flex items-center justify-center min-h-[36px]">
          <div className="max-w-7xl mx-auto w-full overflow-hidden flex items-center justify-center gap-2 relative">
            <div className="animate-pulse w-2 h-2 rounded-full bg-white flex-shrink-0 relative z-10"></div>
            <div className="w-full overflow-hidden text-center select-none">
              <span className="animate-marquee inline-block whitespace-nowrap md:whitespace-normal">
                {announcement}
              </span>
            </div>
          </div>
        </div>
      )}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="flex items-center space-x-3 group">
              <img
                src="/logo.png"
                alt="Elite Bath Collections"
                className="h-11 w-11 object-contain rounded-full border border-gray-200 shadow-sm group-hover:scale-105 transition-transform"
              />
              <div className="flex flex-col">
                <span className="text-lg sm:text-xl font-extrabold tracking-tight text-gray-900 leading-none group-hover:text-primary transition-colors">
                  Elite Bath
                </span>
                <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-primary leading-none mt-0.5">
                  Collections
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex space-x-8">
            <Link to="/shop" className="text-gray-600 hover:text-primary font-medium transition-colors">Shop</Link>
            <Link to="/track-order" className="text-gray-600 hover:text-primary font-medium transition-colors">Track Order</Link>
            <Link to="/contact" className="text-gray-600 hover:text-primary font-medium transition-colors">Contact</Link>
            <Link to="/faq" className="text-gray-600 hover:text-primary font-medium transition-colors">FAQ</Link>
            <Link to="/about" className="text-gray-600 hover:text-primary font-medium transition-colors">About Us</Link>
          </div>

          {/* Search Form with Instant Live Dropdown */}
          <div ref={searchContainerRef} className="hidden lg:block relative w-64 xl:w-80">
            <form onSubmit={handleSearchSubmit} className="flex items-center relative w-full">
              <input
                type="text"
                placeholder="Search faucets, showers, basins..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchFocused(true);
                }}
                onFocus={() => setIsSearchFocused(true)}
                className="w-full bg-gray-50 border border-gray-300 rounded-full py-2 pl-4 pr-10 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-gray-900 placeholder-gray-500 transition-all"
              />
              <button type="submit" className="absolute right-3 top-2.5 text-gray-400 hover:text-primary">
                <Search className="h-4 w-4" />
              </button>
            </form>

            {/* Live Instant Search Dropdown */}
            {isSearchFocused && searchQuery.trim().length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-50 animate-fadeInUp">
                <div className="px-4 py-2.5 bg-gray-50/80 border-b border-gray-100 flex items-center justify-between text-xs text-gray-500">
                  <span className="font-semibold text-gray-700">Matching Products ({searchResults.length})</span>
                  <span className="text-[10px] uppercase tracking-wider text-primary font-bold">Live Catalog</span>
                </div>

                {searchResults.length > 0 ? (
                  <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
                    {searchResults.map((product) => {
                      const mainImg = product.main_image_url || '/logo.png';
                      return (
                        <div
                          key={product.id}
                          onClick={() => handleSelectProduct(product.slug)}
                          className="p-3 flex items-center gap-3 hover:bg-primary/5 cursor-pointer transition-colors group"
                        >
                          <div className="w-12 h-12 rounded-xl bg-gray-50 overflow-hidden flex-shrink-0 border border-gray-200 p-0.5">
                            <img
                              src={mainImg}
                              alt={product.name}
                              className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform duration-200"
                            />
                          </div>
                          <div className="flex-grow min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                                {product.finish || product.category?.name || 'Sanitary'}
                              </span>
                              {product.stock <= 5 && product.stock > 0 && (
                                <span className="text-[10px] font-semibold text-amber-600">
                                  Only {product.stock} left
                                </span>
                              )}
                            </div>
                            <h4 className="text-xs font-bold text-gray-900 truncate group-hover:text-primary transition-colors mt-0.5">
                              {product.name}
                            </h4>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs font-extrabold text-primary">
                                ₹{product.price.toLocaleString('en-IN')}
                              </span>
                            </div>
                          </div>
                          <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-5 text-center">
                    <p className="text-xs text-gray-500">
                      No products found for "<span className="text-gray-900 font-bold">{searchQuery}</span>"
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        navigate('/shop');
                        setSearchQuery('');
                        setIsSearchFocused(false);
                      }}
                      className="mt-2 text-xs font-bold text-primary hover:underline inline-flex items-center gap-1"
                    >
                      Browse full catalog <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                )}

                {searchResults.length > 0 && (
                  <button
                    type="button"
                    onClick={handleSearchSubmit}
                    className="w-full py-2.5 px-4 bg-gray-50 hover:bg-primary/10 border-t border-gray-100 text-xs font-bold text-primary text-center flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>View all matching results</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Icons & Actions */}
          <div className="hidden md:flex items-center space-x-6">
            {/* Admin Badge */}
            {profile?.role === 'admin' && (
              <Link
                to="/admin"
                className="flex items-center space-x-1.5 px-3 py-1 bg-danger/10 border border-danger/20 text-danger rounded-full text-xs font-semibold hover:bg-danger/20 transition-all"
              >
                <ShieldAlert className="h-3.5 w-3.5" />
                <span>Admin</span>
              </Link>
            )}

            {/* Wishlist */}
            <Link to="/dashboard?tab=wishlist" className="relative text-gray-500 hover:text-primary transition-colors">
              <Heart className="h-6 w-6" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-primary text-white font-bold text-[10px] w-4.5 h-4.5 rounded-full flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart */}
            <Link to="/cart" className="relative text-gray-500 hover:text-primary transition-colors">
              <ShoppingCart className="h-6 w-6" />
              {cartItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-primary text-white font-bold text-[10px] w-4.5 h-4.5 rounded-full flex items-center justify-center">
                  {cartItems}
                </span>
              )}
            </Link>

            {/* Profile Dropdown */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center space-x-2 focus:outline-none"
                >
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.full_name || 'User'}
                      className="h-8 w-8 rounded-full border border-gray-300 object-cover"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary font-bold">
                      {(profile?.full_name || user.email || 'A')[0].toUpperCase()}
                    </div>
                  )}
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-3 w-52 bg-white border border-gray-200 rounded-xl shadow-lg p-2 py-3 z-50">
                    <div className="px-3 py-2 border-b border-gray-100 mb-2">
                      <p className="text-sm font-semibold text-gray-900 truncate">{profile?.full_name}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    <Link
                      to="/dashboard"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center space-x-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-all"
                    >
                      <User className="h-4 w-4" />
                      <span>My Dashboard</span>
                    </Link>
                    {profile?.role === 'admin' && (
                      <Link
                        to="/admin"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center space-x-2.5 px-3 py-2 text-sm text-danger hover:bg-danger/10 rounded-lg transition-all"
                      >
                        <ShieldAlert className="h-4 w-4" />
                        <span>Admin Panel</span>
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        signOut();
                      }}
                      className="w-full text-left flex items-center space-x-2.5 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-all"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/auth"
                className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark transition-all shadow-sm"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center space-x-4">
            {/* Wishlist */}
            <Link to="/dashboard?tab=wishlist" className="relative text-gray-500 hover:text-primary">
              <Heart className="h-5.5 w-5.5" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-primary text-white font-bold text-[9px] w-4 h-4 rounded-full flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart */}
            <Link to="/cart" className="relative text-gray-500 hover:text-primary">
              <ShoppingCart className="h-5.5 w-5.5" />
              {cartItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-primary text-white font-bold text-[9px] w-4 h-4 rounded-full flex items-center justify-center">
                  {cartItems}
                </span>
              )}
            </Link>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-600 hover:text-primary focus:outline-none"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-200 px-4 pt-2 pb-6 space-y-4">
          <div ref={mobileSearchRef} className="relative w-full mb-4">
            <form onSubmit={handleSearchSubmit} className="flex items-center relative w-full">
              <input
                type="text"
                placeholder="Search faucets, showers, basins..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchFocused(true);
                }}
                onFocus={() => setIsSearchFocused(true)}
                className="w-full bg-gray-50 border border-gray-300 rounded-full py-2.5 pl-4 pr-10 text-sm focus:outline-none focus:border-primary text-gray-900"
              />
              <button type="submit" className="absolute right-3 top-3 text-gray-400">
                <Search className="h-4 w-4" />
              </button>
            </form>

            {/* Mobile Live Search Dropdown */}
            {isSearchFocused && searchQuery.trim().length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-50 animate-fadeInUp">
                <div className="px-3.5 py-2 bg-gray-50 border-b border-gray-100 flex items-center justify-between text-xs text-gray-500">
                  <span className="font-semibold text-gray-700">Matching Products ({searchResults.length})</span>
                  <span className="text-[10px] uppercase tracking-wider text-primary font-bold">Catalog</span>
                </div>

                {searchResults.length > 0 ? (
                  <div className="max-h-64 overflow-y-auto divide-y divide-gray-100">
                    {searchResults.map((product) => {
                      const mainImg = product.main_image_url || '/logo.png';
                      return (
                        <div
                          key={product.id}
                          onClick={() => handleSelectProduct(product.slug)}
                          className="p-2.5 flex items-center gap-2.5 hover:bg-primary/5 cursor-pointer transition-colors group"
                        >
                          <div className="w-10 h-10 rounded-lg bg-gray-50 overflow-hidden flex-shrink-0 border border-gray-200 p-0.5">
                            <img
                              src={mainImg}
                              alt={product.name}
                              className="w-full h-full object-cover rounded"
                            />
                          </div>
                          <div className="flex-grow min-w-0">
                            <h4 className="text-xs font-bold text-gray-900 truncate">
                              {product.name}
                            </h4>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs font-extrabold text-primary">
                                ₹{product.price.toLocaleString('en-IN')}
                              </span>
                            </div>
                          </div>
                          <ArrowRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 text-center">
                    <p className="text-xs text-gray-500">
                      No products found for "{searchQuery}"
                    </p>
                  </div>
                )}

                {searchResults.length > 0 && (
                  <button
                    type="button"
                    onClick={handleSearchSubmit}
                    className="w-full py-2 px-3 bg-gray-50 hover:bg-primary/10 border-t border-gray-100 text-xs font-bold text-primary text-center flex items-center justify-center gap-1"
                  >
                    <span>View all results</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                )}
              </div>
            )}
          </div>

          <Link
            to="/shop"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block text-gray-700 hover:text-primary text-base font-semibold py-2"
          >
            Shop
          </Link>
          <Link
            to="/track-order"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block text-gray-700 hover:text-primary text-base font-semibold py-2"
          >
            Track Order
          </Link>
          <Link
            to="/contact"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block text-gray-700 hover:text-primary text-base font-semibold py-2"
          >
            Contact
          </Link>
          <Link
            to="/faq"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block text-gray-700 hover:text-primary text-base font-semibold py-2"
          >
            FAQ
          </Link>
          <Link
            to="/about"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block text-gray-700 hover:text-primary text-base font-semibold py-2"
          >
            About Us
          </Link>

          <div className="border-t border-gray-200 pt-4">
            {user ? (
              <div className="space-y-3">
                <Link
                  to="/dashboard"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center space-x-2.5 text-gray-700 hover:text-primary py-2"
                >
                  <User className="h-5 w-5" />
                  <span>My Dashboard</span>
                </Link>
                {profile?.role === 'admin' && (
                  <Link
                    to="/admin"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center space-x-2.5 text-danger py-2 font-semibold"
                  >
                    <ShieldAlert className="h-5 w-5" />
                    <span>Admin Panel</span>
                  </Link>
                )}
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    signOut();
                  }}
                  className="w-full text-left flex items-center space-x-2.5 text-gray-600 hover:text-primary py-2"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <Link
                to="/auth"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block text-center w-full py-3 bg-primary text-white font-semibold rounded-lg"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
    </>
  );
};

import { memo, useCallback } from 'react';
import { Heart } from 'lucide-react';
import type { Product } from '../../types/database';
import { ProductImage } from './ProductImage';

interface ProductCardProps {
  product: Product;
  onNavigate: (slug: string) => void;
  showFeaturedBadge?: boolean;
  showWishlist?: boolean;
  isWishlisted?: boolean;
  onToggleWishlist?: (product: Product) => void;
  stockVariant?: 'text' | 'pill';
  descriptionClassName?: string;
  priceClassName?: string;
}

export const ProductCard = memo(function ProductCard({
  product,
  onNavigate,
  showFeaturedBadge = false,
  showWishlist = false,
  isWishlisted = false,
  onToggleWishlist,
  stockVariant: _stockVariant = 'pill',
  descriptionClassName: _descriptionClassName = 'text-xs',
  priceClassName = 'font-bold text-sm sm:text-lg text-gray-900',
}: ProductCardProps) {
  const handleClick = useCallback(() => {
    onNavigate(product.slug);
  }, [onNavigate, product.slug]);

  const handleWishlistClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onToggleWishlist?.(product);
    },
    [onToggleWishlist, product]
  );

  return (
    <article
      className="bg-white border border-gray-200/80 hover:border-gray-900 transition-colors duration-200 flex flex-col group cursor-pointer"
      onClick={handleClick}
    >
      <div className="relative aspect-[4/5] bg-gray-50/50 overflow-hidden">
        {showFeaturedBadge && (
          <span className="absolute top-2 left-2 z-10 px-2 py-0.5 bg-gray-900 text-white text-[9px] font-semibold uppercase tracking-widest">
            Featured
          </span>
        )}
        <ProductImage
          src={product.main_image_url}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
        />
        {showWishlist && onToggleWishlist && (
          <button
            type="button"
            onClick={handleWishlistClick}
            className={`absolute top-2 right-2 p-1.5 rounded-full hover:scale-110 transition-all z-10 ${
              isWishlisted
                ? 'text-danger'
                : 'text-gray-400 hover:text-gray-900'
            }`}
            aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-current' : ''}`} />
          </button>
        )}
      </div>

      <div className="p-3 sm:p-4 flex flex-col flex-grow border-t border-gray-100">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="text-[10px] uppercase tracking-wider text-gray-400 font-medium truncate">
            {product.finish || product.brand || 'Elite Series'}
          </span>
          {product.stock > 0 ? (
            <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              In stock
            </span>
          ) : (
            <span className="text-[10px] text-gray-400 font-medium">Out of stock</span>
          )}
        </div>

        <h3 className="font-medium text-xs sm:text-sm text-gray-900 group-hover:text-primary transition-colors line-clamp-2 leading-snug mb-1">
          {product.name}
        </h3>

        <div className="flex items-baseline justify-between mt-auto pt-2 border-t border-gray-50">
          <div className="flex items-baseline gap-1">
            {product.has_variants && (
              <span className="text-[10px] text-gray-400">From</span>
            )}
            <span className={priceClassName}>₹{product.price.toLocaleString('en-IN')}</span>
          </div>
          {product.has_variants && (
            <span className="text-[9px] uppercase tracking-wider text-gray-500 font-semibold">
              Variants
            </span>
          )}
        </div>
      </div>
    </article>
  );
});

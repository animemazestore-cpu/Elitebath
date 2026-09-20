import { memo, useCallback } from 'react';
import { Heart } from 'lucide-react';
import type { Product } from '../../types/database';
import { ProductDescription } from './ProductDescription';
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
  stockVariant = 'pill',
  descriptionClassName = 'text-xs',
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
      className="bg-white rounded-2xl border border-border overflow-hidden flex flex-col group cursor-pointer shadow-card hover:shadow-card-hover hover:-translate-y-1 hover:border-primary/40 transition-all duration-300 ease-out"
      onClick={handleClick}
    >
      <div className="relative aspect-[4/5] bg-surface overflow-hidden">
        {showFeaturedBadge && (
          <span className="absolute top-2.5 left-2.5 z-10 px-2.5 py-0.5 bg-primary text-white text-[10px] font-bold uppercase rounded-full tracking-wider shadow-sm">
            Featured
          </span>
        )}
        <ProductImage
          src={product.main_image_url}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-out"
        />
        {showWishlist && onToggleWishlist && (
          <button
            type="button"
            onClick={handleWishlistClick}
            className={`absolute top-2 right-2 sm:top-4 sm:right-4 p-1.5 sm:p-2.5 rounded-full backdrop-blur-md border border-gray-200 hover:scale-110 transition-all z-10 ${
              isWishlisted
                ? 'bg-danger/10 text-danger border-danger/20'
                : 'bg-white text-gray-400 hover:text-gray-900'
            }`}
            aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart className={`h-3.5 w-3.5 sm:h-4.5 sm:w-4.5 ${isWishlisted ? 'fill-current' : ''}`} />
          </button>
        )}
      </div>

      <div className="p-4 sm:p-5 flex flex-col flex-grow">
        <h3 className="font-semibold text-sm sm:text-base text-gray-900 group-hover:text-primary transition-colors line-clamp-2 mb-1">
          {product.name}
        </h3>
        <ProductDescription description={product.description} className={descriptionClassName} lines={3} />
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
          <div>
            <div className="flex items-baseline gap-1">
              {product.has_variants && (
                <span className="text-[10px] text-gray-400 font-medium">From</span>
              )}
              <span className={priceClassName}>₹{product.price.toLocaleString('en-IN')}</span>
            </div>
            {product.has_variants && (
              <span className="text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                Multi-Option
              </span>
            )}
          </div>
          {product.stock > 0 ? (
            stockVariant === 'pill' ? (
              <span className="text-[8px] sm:text-[10px] font-bold text-success bg-success/10 border border-success/20 px-1.5 sm:px-2 py-0.5 rounded uppercase">
                In Stock
              </span>
            ) : (
              <span className="text-[10px] sm:text-xs font-medium text-success">In stock</span>
            )
          ) : stockVariant === 'pill' ? (
            <span className="text-[8px] sm:text-[10px] font-bold text-danger bg-danger/10 border border-danger/20 px-1.5 sm:px-2 py-0.5 rounded uppercase">
              Out of Stock
            </span>
          ) : (
            <span className="text-[10px] sm:text-xs font-medium text-gray-400">Out of stock</span>
          )}
        </div>
      </div>
    </article>
  );
});

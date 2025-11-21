import React from 'react';
import { Sparkles, Tag, Flame, Star } from 'lucide-react';

/**
 * Componente de Badge para Produtos
 * Mostra badges de NOVO, PROMOÇÃO, DESTAQUE, etc
 */
export const ProductBadge = ({ product }) => {
  const badges = [];

  // Badge customizado (prioridade máxima)
  if (product.badge_text) {
    const colorClasses = {
      red: 'bg-red-500',
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      purple: 'bg-purple-500',
      pink: 'bg-pink-500',
      yellow: 'bg-yellow-500',
      orange: 'bg-orange-500',
      black: 'bg-black',
    };

    badges.push({
      text: product.badge_text,
      bgColor: colorClasses[product.badge_color] || 'bg-yellow-500',
      icon: <Flame className="w-3 h-3 sm:w-4 sm:h-4" />,
      priority: 1
    });
  }

  // Badge de Desconto
  if (product.discount_percentage && product.discount_percentage > 0) {
    badges.push({
      text: `-${product.discount_percentage}%`,
      bgColor: 'bg-red-500',
      icon: <Tag className="w-3 h-3 sm:w-4 sm:h-4" />,
      priority: 2
    });
  }

  // Badge de Novo
  if (product.is_new) {
    badges.push({
      text: 'NOVO',
      bgColor: 'bg-blue-500',
      icon: <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />,
      priority: 3
    });
  }

  // Badge de Destaque
  if (product.is_featured) {
    badges.push({
      text: 'DESTAQUE',
      bgColor: 'bg-purple-500',
      icon: <Star className="w-3 h-3 sm:w-4 sm:h-4" />,
      priority: 4
    });
  }

  // Ordenar por prioridade e mostrar até 2 badges
  const visibleBadges = badges.sort((a, b) => a.priority - b.priority).slice(0, 2);

  if (visibleBadges.length === 0) return null;

  return (
    <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
      {visibleBadges.map((badge, index) => (
        <div
          key={index}
          className={`${badge.bgColor} text-white px-2 py-1 rounded-md shadow-lg flex items-center gap-1 text-xs sm:text-sm font-bold animate-pulse`}
        >
          {badge.icon}
          {badge.text}
        </div>
      ))}
    </div>
  );
};

/**
 * Componente de Preço com Desconto
 */
export const ProductPrice = ({ product }) => {
  const hasDiscount = product.discount_percentage && product.discount_percentage > 0;

  return (
    <div className="space-y-1">
      {hasDiscount && product.original_price && (
        <p className="text-sm text-gray-400 line-through">
          R$ {product.original_price.toFixed(2)}
        </p>
      )}
      <p className={`${hasDiscount ? 'text-xl sm:text-2xl' : 'text-lg sm:text-xl'} font-bold ${hasDiscount ? 'text-red-600' : 'text-yellow-600'}`}>
        R$ {product.price.toFixed(2)}
      </p>
      {hasDiscount && (
        <p className="text-xs sm:text-sm text-green-600 font-medium">
          Economia: R$ {(product.original_price - product.price).toFixed(2)}
        </p>
      )}
    </div>
  );
};

export default ProductBadge;

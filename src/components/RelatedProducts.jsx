import React from 'react';
import { ChevronRight } from 'lucide-react';

/**
 * Componente de Produtos Relacionados (Cross-sell/Upsell)
 * Mostra "Você também pode gostar" ou "Complete seu look"
 */
export const RelatedProducts = ({ currentProduct, allProducts, onProductClick, title = "Você também pode gostar" }) => {
  // Buscar produtos relacionados
  let relatedProducts = [];

  // 1. Se o produto tem IDs de produtos relacionados definidos
  if (currentProduct.related_product_ids && currentProduct.related_product_ids.length > 0) {
    relatedProducts = allProducts.filter(p =>
      currentProduct.related_product_ids.includes(p.id) && p.status === 'active' && p.id !== currentProduct.id
    );
  }

  // 2. Se não tem relacionados específicos, pegar da mesma categoria
  if (relatedProducts.length === 0) {
    relatedProducts = allProducts.filter(p =>
      p.category_id === currentProduct.category_id &&
      p.status === 'active' &&
      p.id !== currentProduct.id
    ).slice(0, 4);
  }

  // 3. Se ainda não tem, pegar produtos em destaque
  if (relatedProducts.length === 0) {
    relatedProducts = allProducts.filter(p =>
      p.is_featured &&
      p.status === 'active' &&
      p.id !== currentProduct.id
    ).slice(0, 4);
  }

  // 4. Se ainda não tem, pegar produtos aleatórios
  if (relatedProducts.length === 0) {
    const shuffled = [...allProducts]
      .filter(p => p.status === 'active' && p.id !== currentProduct.id)
      .sort(() => 0.5 - Math.random());
    relatedProducts = shuffled.slice(0, 4);
  }

  if (relatedProducts.length === 0) return null;

  return (
    <div className="mt-12 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">{title}</h2>
        <ChevronRight className="w-6 h-6 text-gray-400" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {relatedProducts.map(product => (
          <div
            key={product.id}
            onClick={() => onProductClick(product.id)}
            className="bg-white rounded-lg shadow-sm overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:scale-105 group"
          >
            <div className="aspect-square bg-gray-200 overflow-hidden relative">
              <img
                src={product.image_urls || 'https://via.placeholder.com/400'}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              />

              {/* Badge de desconto se tiver */}
              {product.discount_percentage > 0 && (
                <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-md text-xs font-bold">
                  -{product.discount_percentage}%
                </div>
              )}
            </div>

            <div className="p-3">
              <h3 className="font-semibold text-gray-800 text-sm mb-2 line-clamp-2 group-hover:text-yellow-600 transition-colors">
                {product.name}
              </h3>

              <div className="space-y-1">
                {product.original_price && product.discount_percentage > 0 && (
                  <p className="text-xs text-gray-400 line-through">
                    R$ {product.original_price.toFixed(2)}
                  </p>
                )}
                <p className="text-base sm:text-lg font-bold text-yellow-600">
                  R$ {product.price.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RelatedProducts;

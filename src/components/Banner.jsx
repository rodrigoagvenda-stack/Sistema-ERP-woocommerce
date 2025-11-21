import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Componente de Banner Hero Responsivo
 * Suporta imagens diferentes para desktop e mobile
 */
export const Banner = ({ banner, darkMode }) => {
  if (!banner) return null;

  const bgGradient = darkMode
    ? 'from-gray-900 via-gray-800 to-black'
    : 'from-yellow-50 via-white to-yellow-50';

  return (
    <div className={`relative w-full overflow-hidden bg-gradient-to-br ${bgGradient}`}>
      {/* Banner Image */}
      <div className="relative max-w-7xl mx-auto">
        <div className="relative aspect-[16/9] sm:aspect-[21/9] md:aspect-[24/9] lg:aspect-[32/9]">
          {/* Imagem Mobile */}
          {banner.image_url_mobile && (
            <img
              src={banner.image_url_mobile}
              alt={banner.title}
              className="absolute inset-0 w-full h-full object-cover sm:hidden"
            />
          )}

          {/* Imagem Desktop */}
          <img
            src={banner.image_url}
            alt={banner.title}
            className={`absolute inset-0 w-full h-full object-cover ${banner.image_url_mobile ? 'hidden sm:block' : ''}`}
          />

          {/* Overlay escuro para melhor legibilidade */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent" />

          {/* Conteúdo do Banner */}
          <div className="absolute inset-0 flex items-center">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
              <div className="max-w-xl space-y-4">
                <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white drop-shadow-lg">
                  {banner.title}
                </h2>

                {banner.description && (
                  <p className="text-base sm:text-lg md:text-xl text-white/90 drop-shadow-md">
                    {banner.description}
                  </p>
                )}

                {banner.button_text && (
                  <button
                    onClick={() => {
                      if (banner.link_url) {
                        window.location.href = banner.link_url;
                      }
                    }}
                    className="inline-flex items-center gap-2 px-6 py-3 sm:px-8 sm:py-4 bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200"
                  >
                    {banner.button_text}
                    <ChevronRight className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Banner;

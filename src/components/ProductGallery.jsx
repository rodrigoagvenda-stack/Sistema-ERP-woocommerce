import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function ProductGallery({ images = [] }) {
  const [currentImage, setCurrentImage] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="w-full h-96 bg-gray-200 flex items-center justify-center rounded-lg">
        <p className="text-gray-500">Sem imagens</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Imagem Principal */}
      <div className="relative w-full h-96 md:h-[500px] bg-white rounded-lg overflow-hidden border">
        <img
          src={images[currentImage]}
          alt={`Foto ${currentImage + 1}`}
          className="w-full h-full object-contain"
        />

        {/* Setas de navegação */}
        {images.length > 1 && (
          <>
            <button
              onClick={() => setCurrentImage(prev => (prev - 1 + images.length) % images.length)}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg"
              aria-label="Imagem anterior"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={() => setCurrentImage(prev => (prev + 1) % images.length)}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg"
              aria-label="Próxima imagem"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Indicador */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
            {currentImage + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Miniaturas */}
      {images.length > 1 && (
        <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
          {images.map((img, index) => (
            <button
              key={index}
              onClick={() => setCurrentImage(index)}
              className={`
                relative h-20 rounded-lg overflow-hidden border-2 transition-all
                ${currentImage === index
                  ? 'border-yellow-500 ring-2 ring-yellow-300'
                  : 'border-gray-200 hover:border-gray-400'}
              `}
            >
              <img
                src={img}
                alt={`Miniatura ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

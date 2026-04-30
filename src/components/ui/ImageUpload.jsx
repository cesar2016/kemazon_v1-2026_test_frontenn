import { useState, useRef } from 'react';
import { Upload, X, Star, Image as ImageIcon } from 'lucide-react';

function resizeImage(file, maxWidth = 1200, maxHeight = 1200, quality = 0.8) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        const resizedUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(resizedUrl);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

export function ImageUpload({ images, setImages, maxImages = 6 }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = async (files) => {
    const validFiles = Array.from(files).filter(file => 
      file.type.startsWith('image/')
    ).slice(0, maxImages - images.length);

    for (const file of validFiles) {
      const resizedUrl = await resizeImage(file);
      setImages(prev => [
        ...prev,
        {
          url: resizedUrl,
          file: file,
          isPrimary: prev.length === 0,
          isExisting: false,
        }
      ]);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const removeImage = (index) => {
    setImages(prev => {
      const newImages = prev.filter((_, i) => i !== index);
      if (prev[index].isPrimary && newImages.length > 0) {
        newImages[0].isPrimary = true;
      }
      return newImages;
    });
  };

  const setPrimary = (index) => {
    setImages(prev => prev.map((img, i) => ({
      ...img,
      isPrimary: i === index,
    })));
  };

  const canAddMore = images.length < maxImages;

  return (
    <div className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
          dragOver 
            ? 'border-primary-500 bg-primary-50' 
            : 'border-gray-300 hover:border-primary-400'
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => canAddMore && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <Upload className={`w-12 h-12 mx-auto mb-3 ${dragOver ? 'text-primary-500' : 'text-gray-400'}`} />
        <p className="text-gray-600 mb-1">
          <strong>Arrastra las imágenes aquí</strong> o haz clic para seleccionar
        </p>
        <p className="text-sm text-gray-400">
          Máximo {maxImages} imágenes (PNG, JPG, WEBP)
        </p>
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
          {images.map((img, index) => (
            <div 
              key={index} 
              className={`relative group rounded-lg overflow-hidden border-2 transition-all aspect-square ${
                img.isPrimary ? 'border-primary-500 ring-2 ring-primary-200' : 'border-gray-200'
              }`}
            >
              <img 
                src={img.url} 
                alt="" 
                className="w-full h-full object-cover"
              />
              
              {img.isPrimary && (
                <div className="absolute top-2 left-2 bg-primary-500 text-white text-xs px-2 py-1 rounded-full flex items-center">
                  <Star className="w-3 h-3 mr-1" /> Principal
                </div>
              )}
              
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {!img.isPrimary && (
                  <button
                    type="button"
                    onClick={() => setPrimary(index)}
                    className="p-2 bg-white rounded-full text-gray-700 hover:bg-primary-50"
                    title="Establecer como principal"
                  >
                    <Star className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="p-2 bg-white rounded-full text-red-600 hover:bg-red-50"
                  title="Eliminar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          
          {canAddMore && images.length > 0 && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-primary-400 hover:text-primary-500 transition-colors"
            >
              <ImageIcon className="w-6 h-6 mb-1" />
              <span className="text-xs">Agregar</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

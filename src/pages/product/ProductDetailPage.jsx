import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import {
  Star, ShoppingCart, Heart, Eye, Truck, Shield,
  RotateCcw, Minus, Plus, X, ChevronLeft, ChevronRight,
  ZoomIn, CreditCard, Package, Check, Trophy, Gavel,
  ArrowLeft, Info, MapPin, Zap
} from 'lucide-react';
import { productService, auctionService, getProductImageUrl } from '../../services/api';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { Layout } from '../../components/layout';
import { Button, Card, Badge, PriceFormatter, Spinner, CountdownTimer } from '../../components/ui';
import { LikersModal } from '../../components/product/LikersModal';
import { toast } from 'sonner';

/**
 * ImageCarouselModal - Premium Fullscreen Image Viewer
 */
function ImageCarouselModal({ images, initialIndex, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const goToPrevious = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-gray-950/95 backdrop-blur-xl flex items-center justify-center animate-fade-in"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors z-50 bg-white/10 p-3 rounded-full hover:bg-white/20"
      >
        <X className="w-6 h-6" />
      </button>

      <button
        onClick={goToPrevious}
        className="absolute left-4 sm:left-8 text-white/70 hover:text-white p-4 bg-white/5 hover:bg-white/10 rounded-full transition-all backdrop-blur-md z-40 hidden sm:block"
      >
        <ChevronLeft className="w-8 h-8" />
      </button>

      <div className="w-full h-full flex items-center justify-center p-4 sm:p-12 cursor-default" onClick={e => e.stopPropagation()}>
        <img
          src={images[currentIndex]}
          alt=""
          className="max-w-full max-h-[85vh] object-contain drop-shadow-2xl select-none"
        />
      </div>

      <button
        onClick={goToNext}
        className="absolute right-4 sm:right-8 text-white/70 hover:text-white p-4 bg-white/5 hover:bg-white/10 rounded-full transition-all backdrop-blur-md z-40 hidden sm:block"
      >
        <ChevronRight className="w-8 h-8" />
      </button>

      {/* Mobile thumbnails / dots */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-3">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={(e) => { e.stopPropagation(); setCurrentIndex(index); }}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${currentIndex === index ? 'bg-primary-500 w-8' : 'bg-white/30 hover:bg-white/50'
              }`}
          />
        ))}
      </div>

      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 text-white/50 text-sm font-medium tracking-widest">
        {currentIndex + 1} <span className="mx-1">/</span> {images.length}
      </div>
    </div>
  );
}

export function ProductDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { addItem } = useCart();
  const queryClient = useQueryClient();

  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLikersModalOpen, setIsLikersModalOpen] = useState(false);
  const [isVisitorsModalOpen, setIsVisitorsModalOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [visitSessionId] = useState(() => Math.random().toString(36).substring(2, 15));

  // Queries
  const { data, isLoading, error } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => productService.getBySlug(slug),
  });

  const product = data?.data?.product;

  // Mutations
  const toggleLikeMutation = useMutation({
    mutationFn: (productId) => productService.toggleLike(productId),
    onSuccess: () => {
      queryClient.invalidateQueries(['product', slug]);
    },
  });

  const { data: likersData, isLoading: isLoadingLikers, refetch: refetchLikers } = useQuery({
    queryKey: ['product-likers', product?.id],
    queryFn: () => productService.getLikers(product?.id),
    enabled: !!product?.id,
  });

  const { data: visitorsData, isLoading: isLoadingVisitors, refetch: refetchVisitors } = useQuery({
    queryKey: ['product-visitors', product?.id],
    queryFn: () => productService.getVisitors(product?.id),
    enabled: !!product?.id,
  });

  const pingVisitMutation = useMutation({
    mutationFn: () => productService.pingVisit(product.id, visitSessionId),
    retry: false,
    retryOnMount: false,
  });

  // Effects
  useEffect(() => {
    if (!product) return;

    // If it's an auction, redirect as per existing pattern
    if (product.type === 'auction' && product.auction?.id) {
      navigate(`/auctions/${product.auction?.product?.slug}`, { replace: true });
      return;
    }

    // Track visits - only call once on mount
    pingVisitMutation.mutate();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id]);

  // UI Helpers
  const images = useMemo(() => {
    if (!product) return [];
    const prodImages = (product.images && product.images.length > 0 && product.images[0] !== 'test')
      ? product.images
      : (product.thumbnail ? [product.thumbnail] : []);
    return prodImages;
  }, [product]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.error('Debes iniciar sesión para agregar al carrito');
      navigate('/login');
      return;
    }

    try {
      await addItem(product.id, quantity, 'direct');
      toast.success('¡Producto agregado al carrito exitosamente!', {
        icon: <ShoppingCart className="w-4 h-4 text-green-500" />
      });
    } catch (err) {
      // Error handled by interceptor
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-[70vh] flex flex-col items-center justify-center">
          <Spinner size="lg" />
          <p className="mt-4 text-gray-500 font-medium animate-pulse transition-all">
            Cargando producto...
          </p>
        </div>
      </Layout>
    );
  }

  if (error || !product) {
    return (
      <Layout>
        <div className="py-20 text-center max-w-lg mx-auto px-6">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Package className="w-10 h-10 text-gray-400" />
          </div>
          <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Producto no disponible</h2>
          <p className="text-gray-600 mb-8 leading-relaxed">
            Lo sentimos, el producto que buscas no existe o ha sido retirado.
            Puedes explorar otros productos similares en nuestra tienda.
          </p>
          <Button onClick={() => navigate('/products')} variant="primary" size="lg" className="w-full sm:w-auto">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Explorar Productos
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <>
      <Helmet>
        <title>{product?.name} | KEMAZON.ar</title>
        <meta name="description" content={product?.description?.substring(0, 160) || 'Compra este producto en KEMAZON.ar - La mejor plataforma de e-commerce de Argentina.'} />
        <meta property="og:title" content={product?.name + ' | KEMAZON.ar'} />
        <meta property="og:description" content={product?.description?.substring(0, 160) || 'Compra este producto en KEMAZON.ar'} />
        <meta property="og:image" content={product?.thumbnail || images?.[0] || ''} />
        <meta property="og:url" content={window.location.href} />
        <meta property="og:type" content="product" />
      </Helmet>
      <Layout>
        <div className="bg-gray-50 min-h-screen">
        {/* Breadcrumb - Desktop Only */}
        <div className="hidden sm:block border-b border-gray-100 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <nav className="flex text-sm font-medium w-full">
              <Link to="/" className="text-gray-500 hover:text-primary-600 transition-colors flex-shrink-0">Inicio</Link>
              <ChevronRight className="w-4 h-4 mx-2 text-gray-300 flex-shrink-0" />
              <Link to="/products" className="text-gray-500 hover:text-primary-600 transition-colors flex-shrink-0">Productos</Link>
              <ChevronRight className="w-4 h-4 mx-2 text-gray-300 flex-shrink-0" />
              <span className="text-gray-900 truncate">{product.name}</span>
            </nav>
          </div>
        </div>

        {/* Mobile Header (Floating) */}
        <div className="sm:hidden sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center justify-between w-full">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <span className="font-bold text-gray-900 truncate max-w-[180px]">{product.name}</span>
          <button
            onClick={() => setIsShareOpen(true)}
            className="p-2 -mr-2 text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
          >
            <Share2 className="w-6 h-6" />
          </button>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12 w-full overflow-x-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-start w-full">

            {/* Left Column: Gallery Section (7 cols) */}
            <div className="lg:col-span-7 space-y-6 w-full">
              <div className="flex flex-col-reverse sm:flex-row gap-4 w-full">
                {/* Thumbnails */}
                {images.length > 1 && (
                  <div className="flex sm:flex-col gap-3 overflow-x-auto sm:overflow-y-auto scrollbar-hide sm:max-h-[600px] w-full sm:w-24 flex-shrink-0 pb-2 sm:pb-0">
                    {images.map((image, index) => (
                      <button
                        key={index}
                        onMouseEnter={() => setSelectedImage(index)}
                        className={`group relative aspect-square rounded-2xl overflow-hidden border-2 transition-all duration-300 flex-shrink-0 sm:w-full w-20 ${selectedImage === index
                            ? 'border-primary-500 ring-2 ring-primary-50 shadow-md'
                            : 'border-transparent bg-white hover:border-gray-200'
                          }`}
                      >
                        <img src={image} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                        {selectedImage === index && (
                          <div className="absolute inset-0 bg-primary-500/10 pointer-events-none" />
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {/* Main Viewport */}
                <div
                  className="flex-1 relative aspect-square sm:aspect-auto sm:h-[600px] rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden bg-white border border-gray-100 shadow-2xl shadow-gray-200/50 group cursor-zoom-in p-4 sm:p-0 min-w-0"
                  onClick={() => setIsModalOpen(true)}
                >
                  {/* Badge: Stock/Condition */}
                  <div className="absolute top-6 left-6 z-10 flex flex-col gap-2">
                    {product.stock > 0 ? (
                      <Badge variant="success" className="px-4 py-2 text-[10px] font-black uppercase tracking-widest bg-white/90 backdrop-blur-sm border-none shadow-sm">
                        En Stock
                      </Badge>
                    ) : (
                      <Badge variant="danger" className="px-4 py-2 text-[10px] font-black uppercase tracking-widest bg-white/90 backdrop-blur-sm border-none shadow-sm">
                        Agotado
                      </Badge>
                    )}
                    {product.type === 'auction' && (
                      <Badge variant="warning" className="px-4 py-2 text-[10px] font-black uppercase tracking-widest bg-white/90 backdrop-blur-sm border-none shadow-sm">
                        <Gavel className="w-3.5 h-3.5 mr-1" /> Subasta
                      </Badge>
                    )}
                  </div>

                  {/* Like Button on Image */}
                  <div className="absolute top-6 right-6 z-10 flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsShareOpen(true);
                      }}
                      className="p-4 rounded-3xl bg-white/80 text-gray-400 hover:text-primary-600 hover:bg-white transition-all duration-300 shadow-xl backdrop-blur-md sm:hidden"
                    >
                      <Share2 className="w-6 h-6 transition-transform hover:scale-125" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLikeMutation.mutate(product.id);
                      }}
                      className={`p-4 rounded-3xl transition-all duration-300 shadow-xl backdrop-blur-md ${product.is_liked
                          ? 'bg-red-500 text-white hover:bg-red-600 scale-110'
                          : 'bg-white/80 text-gray-400 hover:text-red-500 hover:bg-white'
                        }`}
                    >
                      <Heart className={`w-6 h-6 transition-transform hover:scale-125 ${product.is_liked ? 'fill-current' : ''}`} />
                    </button>
                  </div>

                  <img
                    src={images[selectedImage]}
                    alt={product.name}
                    className="w-full h-full object-contain transition-transform duration-700 ease-out group-hover:scale-110"
                  />

                  {/* Zoom Hint */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="bg-white/90 backdrop-blur-md rounded-full p-4 shadow-2xl scale-75 group-hover:scale-100 transition-transform">
                      <ZoomIn className="w-6 h-6 text-gray-800" />
                    </div>
                  </div>

                  {/* Image counter for mobile */}
                  <div className="absolute bottom-6 right-6 bg-gray-900/40 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-xs font-bold sm:hidden">
                    {selectedImage + 1} / {images.length}
                  </div>
                </div>
              </div>

              {/* Product Tabs / Info */}
              <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm space-y-8 animate-fade-in">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-8 bg-primary-500 rounded-full" />
                  <h2 className="text-2xl font-black text-gray-900 tracking-tight">Detalles del producto</h2>
                </div>

                <div className="prose prose-lg max-w-none text-gray-600 leading-relaxed">
                  <p className="whitespace-pre-wrap font-medium">
                    {product.description || 'Este vendedor no ha proporcionado una descripción detallada para este producto.'}
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-8 border-t border-gray-50">
                  <div className="p-4 bg-gray-50 rounded-2xl">
                    <p className="text-xs font-bold text-gray-400 uppercase mb-1 tracking-wider">Publicado</p>
                    <p className="font-bold text-gray-900">{new Date(product.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-2xl">
                    <p className="text-xs font-bold text-gray-400 uppercase mb-1 tracking-wider">Unidades</p>
                    <p className="font-bold text-gray-900 font-mono">{product.stock} disp.</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-2xl col-span-2 sm:col-span-1">
                    <p className="text-xs font-bold text-gray-400 uppercase mb-1 tracking-wider">Categoría</p>
                    <p className="font-bold text-gray-900 truncate">{product.category?.name || 'Varios'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Pricing & Purchase Sections (5 cols) */}
            <div className="lg:col-span-5 space-y-8 h-full w-full">
              {/* Product Info Card */}
              <div className="bg-white rounded-[2.5rem] p-8 sm:p-10 border border-gray-100 shadow-xl shadow-gray-200/50 space-y-6 w-full">

                {/* Stats & Title */}
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-black">
                      <Star className="w-3 h-3 fill-current mr-1" />
                      4.8
                    </div>
                    <button
                      onClick={() => { refetchLikers(); setIsLikersModalOpen(true); }}
                      className="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-red-500 transition-colors uppercase tracking-wider"
                    >
                      <Heart className="w-3.5 h-3.5" />
                      {product.likes_count || 0} favoritos
                    </button>
                    <button
                      onClick={() => { refetchVisitors(); setIsVisitorsModalOpen(true); }}
                      className="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-primary-500 transition-colors uppercase tracking-wider"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      {product.valid_visits_count || 0} visitas
                    </button>
                  </div>

                  <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight leading-[1.1] group relative">
                    <span className="relative z-10">{product.name}</span>
                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-0 group-hover:opacity-100 translate-x-[-100%] group-hover:translate-x-[100%] transition-all duration-700 ease-in-out blur-sm"></span>
                  </h1>
                </div>

                {/* Price Section */}
                <div className="py-6 border-y border-gray-50">
                  <div className="flex items-end gap-3 flex-wrap">
                    <PriceFormatter
                      price={product.price}
                      className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tighter"
                    />
                    <Badge variant="primary" className="mb-2 bg-primary-50 text-primary-600 border-none font-bold">
                      Paga en cuotas
                    </Badge>
                  </div>
                  <p className="mt-3 text-sm text-gray-500 font-medium flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-green-500" />
                    Garantía Kemazon de 12 meses incluida
                  </p>
                </div>

                {/* Purchase Controls */}
                <div className="space-y-6 pt-4">
                  {product.stock > 0 ? (
                    <>
                      {/* Quantity Selector */}
                      <div>
                        <p className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">Seleccionar Cantidad</p>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center bg-gray-100 p-1.5 rounded-2xl border border-gray-200">
                            <button
                              onClick={() => setQuantity(Math.max(1, quantity - 1))}
                              className="w-10 h-10 flex items-center justify-center rounded-xl bg-white shadow-sm hover:text-primary-600 transition-all active:scale-90 disabled:opacity-50"
                              disabled={quantity <= 1}
                            >
                              <Minus className="w-5 h-5" />
                            </button>
                            <span className="w-14 text-center font-black text-lg font-mono">
                              {quantity}
                            </span>
                            <button
                              onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                              className="w-10 h-10 flex items-center justify-center rounded-xl bg-white shadow-sm hover:text-primary-600 transition-all active:scale-90 disabled:opacity-50"
                              disabled={quantity >= product.stock}
                            >
                              <Plus className="w-5 h-5" />
                            </button>
                          </div>
                          <p className="ml-3 text-xs text-gray-400 font-medium italic">
                            {product.stock} disponibles
                          </p>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col gap-3">
                        <Button
                          onClick={handleAddToCart}
                          size="lg"
                          className="w-full py-5 rounded-[1.25rem] text-lg font-black bg-gradient-to-r from-primary-600 to-primary-500 hover:shadow-2xl hover:shadow-primary-500/40 transform hover:-translate-y-1"
                        >
                          <ShoppingCart className="w-6 h-6 mr-3" />
                          Agregar al carrito
                        </Button>
                        <Button
                          variant="secondary"
                          size="lg"
                          className="w-full py-5 rounded-[1.25rem] text-lg font-black border-2 border-gray-100 transform hover:-translate-y-1"
                        >
                          Comprar Ahora
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="p-8 bg-red-50 rounded-[2rem] border border-red-100 text-center space-y-4">
                      <Package className="w-12 h-12 text-red-500 mx-auto" />
                      <h3 className="text-xl font-bold text-red-700">¡Ups! Se ha agotado</h3>
                      <p className="text-red-600/70 text-sm">Este producto no tiene stock disponible actualmente. No te preocupes, ¡tenemos otros geniales!</p>
                      <Button variant="outline" className="w-full border-red-200 text-red-600 hover:bg-red-100">
                        Avisarme cuando vuelva
                      </Button>
                    </div>
                  )}
                </div>

                {/* Secure Trust Badges */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-50 rounded-xl">
                      <Truck className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-gray-900">Envío Gratis</p>
                      <p className="text-[10px] text-gray-500 font-medium">A todo el país</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-green-50 rounded-xl">
                      <Shield className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-gray-900">Compra Protegida</p>
                      <p className="text-[10px] text-gray-500 font-medium">Recibe lo que esperabas</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-purple-50 rounded-xl">
                      <RotateCcw className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-gray-900">Devolución Gratis</p>
                      <p className="text-[10px] text-gray-500 font-medium">30 días de prueba</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-amber-50 rounded-xl">
                      <MapPin className="w-5 h-5 text-amber-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-gray-900">Retiro Local</p>
                      <p className="text-[10px] text-gray-500 font-medium">Ver puntos de entrega</p>
                    </div>
                  </div>
                </div>

              </div>

              {/* Seller Info Card */}
              <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm transition-all hover:shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-500 fill-current" />
                    Información del vendedor
                  </h3>
                  <div className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-100">
                    MercadoLíder Platinum
                  </div>
                </div>

                <div className="flex items-center gap-5">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-primary-500/20">
                      {product.user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-4 border-white rounded-full" />
                  </div>
                  <div>
                    <p className="text-xl font-black text-gray-900 inline-flex items-center gap-1.5">
                      {product.user?.name}
                      <Check className="w-4 h-4 text-white bg-blue-500 rounded-full p-0.5" />
                    </p>
                    <p className="text-sm text-gray-500 font-medium">Miembro desde {new Date(product.user?.created_at).getFullYear()}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-1 mt-8 py-4 border-y border-gray-50">
                  <div className="text-center">
                    <p className="text-lg font-black text-gray-900">5.2k</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Ventas</p>
                  </div>
                  <div className="text-center border-x border-gray-50 px-2">
                    <p className="text-lg font-black text-green-600">Alta</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Reputación</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-black text-gray-900">4.9/5</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Valoración</p>
                  </div>
                </div>

                <button className="w-full mt-6 text-sm font-black text-primary-600 hover:text-primary-700 transition-colors py-2 group">
                  Ver más productos de este vendedor
                  <ChevronRight className="w-4 h-4 inline-block ml-1 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              {/* Payment Methods */}
              <div className="bg-gray-100/50 rounded-[2rem] p-8 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="w-5 h-5 text-gray-600" />
                  <span className="text-sm font-black text-gray-900 uppercase tracking-widest">Medios de Pago</span>
                </div>
                <div className="flex flex-wrap gap-4 grayscale opacity-60">
                  {/* Simplified placeholders for logos */}
                  <div className="h-8 px-4 bg-white rounded-lg flex items-center justify-center font-black text-[10px] tracking-tighter text-blue-800 shadow-sm border border-gray-100">VISA</div>
                  <div className="h-8 px-4 bg-white rounded-lg flex items-center justify-center font-black text-[10px] tracking-tighter text-amber-600 shadow-sm border border-gray-100">MASTERCARD</div>
                  <div className="h-8 px-4 bg-white rounded-lg flex items-center justify-center font-black text-[10px] tracking-tighter text-sky-500 shadow-sm border border-gray-100 underline decoration-2">mercadopago</div>
                  <div className="h-8 px-4 bg-white rounded-lg flex items-center justify-center font-black text-[10px] tracking-tighter text-gray-400 shadow-sm border border-gray-100 italic">Efectivo</div>
                </div>
                <p className="text-[10px] text-gray-400 font-medium">Todos tus pagos están protegidos por encriptación avanzada SSL de 256-bit.</p>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {isModalOpen && (
        <ImageCarouselModal
          images={images}
          initialIndex={selectedImage}
          onClose={() => setIsModalOpen(false)}
        />
      )}

      <LikersModal
        isOpen={isLikersModalOpen}
        onClose={() => setIsLikersModalOpen(false)}
        likers={likersData?.data?.likers || likersData?.likers || []}
        isLoading={isLoadingLikers}
      />

      <LikersModal
        isOpen={isVisitorsModalOpen}
        onClose={() => setIsVisitorsModalOpen(false)}
        likers={visitorsData?.data?.visitors || visitorsData?.visitors || []}
        isLoading={isLoadingVisitors}
        title="Visitantes del Producto"
        emptyMessage="Aún no hay visitas registradas."
      />

      {/* Persistent CTA Bar for Mobile */}
      {product.stock > 0 && (
        <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 p-4 bg-white/95 backdrop-blur-xl border-t border-gray-100 shadow-[0_-8px_30px_rgb(0,0,0,0.08)] animate-fade-in animate-slide-up">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Precio Total</p>
              <PriceFormatter price={product.price * quantity} className="text-2xl font-black text-gray-900 tracking-tighter" />
            </div>
            <Button onClick={handleAddToCart} className="flex-[1.5] py-4 rounded-2xl font-black">
              <ShoppingCart className="w-5 h-5 mr-2" />
              Lo quiero
            </Button>
          </div>
        </div>
      )}
      </Layout>
    </>
  );
}

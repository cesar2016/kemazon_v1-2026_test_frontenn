import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Star, ShoppingCart, Gavel, Heart, Eye, Share2, Truck, Shield, RotateCcw, Minus, Plus, X, ChevronLeft, ChevronRight, ZoomIn, CreditCard, Package, Check, Trophy } from 'lucide-react';
import { productService, auctionService } from '../../services/api';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { Layout } from '../../components/layout';
import { Button, Card, Badge, PriceFormatter, Spinner, CountdownTimer, Modal } from '../../components/ui';
import { LikersModal } from '../../components/product/LikersModal';
import { toast } from 'sonner';

function ImageCarouselModal({ images, initialIndex, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
      >
        <X className="w-8 h-8" />
      </button>

      <button
        onClick={goToPrevious}
        className="absolute left-4 text-white hover:text-gray-300 p-2 bg-black/30 rounded-full"
      >
        <ChevronLeft className="w-8 h-8" />
      </button>

      <div className="max-w-5xl max-h-[90vh] mx-4">
        <img
          src={images[currentIndex]}
          alt=""
          className="max-w-full max-h-[85vh] object-contain"
        />
      </div>

      <button
        onClick={goToNext}
        className="absolute right-4 text-white hover:text-gray-300 p-2 bg-black/30 rounded-full"
      >
        <ChevronRight className="w-8 h-8" />
      </button>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-3 h-3 rounded-full transition-colors ${currentIndex === index ? 'bg-white' : 'bg-white/40'
              }`}
          />
        ))}
      </div>

      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 text-white text-sm">
        {currentIndex + 1} / {images.length}
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
  const [bidAmount, setBidAmount] = useState('');
  const [isAutoMode, setIsAutoMode] = useState(false);
  const [showAllBids, setShowAllBids] = useState(false);
  const [isLikersModalOpen, setIsLikersModalOpen] = useState(false);
  const [isVisitorsModalOpen, setIsVisitorsModalOpen] = useState(false);
  const [visitSessionId] = useState(() => Math.random().toString(36).substring(2, 15));

  const { data, isLoading, error } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => productService.getBySlug(slug),
  });

  const calculateMinIncrement = (currentPrice) => {
    const price = Number(currentPrice);
    if (price < 20000) return Math.ceil(price * 0.10);
    if (price <= 100000) return Math.ceil(price * 0.05);
    return 10000;
  };

  useEffect(() => {
    if (data?.data?.product?.auction) {
      const auctionData = data.data.product.auction;
      const increment = calculateMinIncrement(auctionData.current_price);
      setBidAmount(String(Number(auctionData.current_price) + increment));
    }
  }, [data]); // eslint-disable-line react-hooks/exhaustive-deps

  const placeBidMutation = useMutation({
    mutationFn: ({ auctionId, amount }) => auctionService.placeBid(auctionId, amount),
    onSuccess: (data) => {
      queryClient.invalidateQueries(['product', slug]);
      toast.success(data.data.message || '¡Oferta realizada con éxito!');
    },
    onError: (error) => {
      // El error ya es manejado por el interceptor global
    },
  });

  const toggleLikeMutation = useMutation({
    mutationFn: (productId) => productService.toggleLike(productId),
    onSuccess: () => {
      queryClient.invalidateQueries(['product', slug]);
    },
  });

  const { data: likersData, isLoading: isLoadingLikers } = useQuery({
    queryKey: ['product-likers', data?.data?.product?.id],
    queryFn: () => productService.getLikers(data.data.product.id),
    enabled: !!data?.data?.product?.id,
  });

  const { data: visitorsData, isLoading: isLoadingVisitors } = useQuery({
    queryKey: ['product-visitors', data?.data?.product?.id],
    queryFn: () => productService.getVisitors(data.data.product.id),
    enabled: !!data?.data?.product?.id,
  });

  const pingVisitMutation = useMutation({
    mutationFn: () => productService.pingVisit(data.data.product.id, visitSessionId),
  });

  useEffect(() => {
    if (data?.data?.product?.id) {
      const product = data.data.product;
      // If it's an auction, redirect to the specialized auction page
      if (product.type === 'auction' && product.auction?.id) {
        navigate(`/auctions/${product.auction.id}`, { replace: true });
        return;
      }

      // Ping immediately
      pingVisitMutation.mutate();

      // Set interval for 5 seconds
      const interval = setInterval(() => {
        pingVisitMutation.mutate();
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [data?.data?.product?.id]);

  const configureAutoBidMutation = useMutation({
    mutationFn: ({ auctionId, maxBid }) => auctionService.configureAutoBid(auctionId, maxBid),
    onSuccess: (data) => {
      queryClient.invalidateQueries(['product', slug]);
      toast.success(data.data.message || '¡Auto-oferta configurada!');
      setBidAmount('');
    },
    onError: (error) => {
      // El error ya es manejado por el interceptor global
    },
  });

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('es-AR'),
      time: date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
    };
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="py-12"><Spinner size="lg" /></div>
      </Layout>
    );
  }

  if (error || !data?.data?.product) {
    return (
      <Layout>
        <div className="py-12 text-center">
          <h2 className="text-xl font-semibold text-gray-900">Producto no encontrado</h2>
          <Link to="/products" className="text-primary-600 hover:underline mt-4 inline-block">
            Volver a productos
          </Link>
        </div>
      </Layout>
    );
  }

  const product = data.data.product;
  const images = (product.images && product.images.length > 0 && product.images[0] !== 'test')
    ? product.images
    : (product.thumbnail ? [product.thumbnail] : []);
  const auction = product.auction;
  const userHasAutoBid = auction?.bids?.some(b => b.user?.id === user?.id && b.max_bid && b.is_winning);

  const isAuctionEnded = auction && new Date(auction.ends_at) < new Date();
  const isOwner = user?.id === product?.user_id;
  const minIncrement = auction ? calculateMinIncrement(auction.current_price) : 0;
  const minBid = auction ? Number(auction.current_price) + minIncrement : 0;

  const handleBidding = () => {
    if (!isAuthenticated) {
      toast.error('Debes iniciar sesión para ofertar');
      return;
    }
    if (isOwner) {
      toast.error('No puedes ofertar en tu propia subasta');
      return;
    }
    const amount = Number(bidAmount);

    if (isAutoMode) {
      if (!bidAmount || isNaN(amount) || amount < minBid) {
        toast.error(`El monto máximo debe ser al menos $${minBid.toLocaleString('es-AR', { minimumFractionDigits: 0 })} (Precio actual + incremento)`);
        return;
      }
      configureAutoBidMutation.mutate({ auctionId: auction.id, maxBid: amount });
    } else {
      if (isNaN(amount) || amount < minBid) {
        toast.error(`La oferta mínima es $${minBid.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`);
        return;
      }
      placeBidMutation.mutate({ auctionId: auction.id, amount });
    }
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.error('Debes iniciar sesión para agregar al carrito');
      return;
    }

    try {
      if (product.type === 'auction') {
        await addItem(product.id, 1, 'auction', product.auction.id);
      } else {
        await addItem(product.id, quantity, 'direct');
      }
      toast.success('Producto agregado al carrito');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al agregar al carrito');
    }
  };

  return (
    <Layout>
      <div className="bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-6">
            <Link to="/" className="hover:text-primary-600">Inicio</Link>
            <span>/</span>
            <Link to="/products" className="hover:text-primary-600">Productos</Link>
            <span>/</span>
            <span className="text-gray-900">{product.name}</span>
          </nav>

          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex gap-2 overflow-x-auto pb-2">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onMouseEnter={() => setSelectedImage(index)}
                    onClick={() => {
                      setSelectedImage(index);
                      setIsModalOpen(true);
                    }}
                    className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${selectedImage === index ? 'border-primary-500 ring-2 ring-primary-200' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <img src={image} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>

              <div
                className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100 cursor-zoom-in group"
                onClick={() => setIsModalOpen(true)}
              >
                <img
                  src={images[selectedImage]}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />

                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-full p-3">
                    <ZoomIn className="w-6 h-6 text-gray-700" />
                  </div>
                </div>

                {product.type === 'auction' && (
                  <Badge variant="warning" className="absolute top-4 left-4">
                    <Gavel className="w-4 h-4 mr-1" /> Subasta
                  </Badge>
                )}

                {images.length > 1 && (
                  <div className="absolute bottom-4 right-4 bg-black/60 text-white text-sm px-3 py-1 rounded-full">
                    {selectedImage + 1}/{images.length}
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="mt-6 lg:mt-0 bg-gray-50 rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Descripción del producto</h2>
                <div className="prose prose-sm max-w-none">
                  <p className="text-gray-600 whitespace-pre-wrap">{product.description || 'Sin descripción disponible'}</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h1 className="text-2xl font-bold text-gray-900 mb-0">{product.name}</h1>
                  <div className="flex flex-col items-center gap-4">
                    <div className="flex flex-col items-center">
                      <button
                        onClick={() => toggleLikeMutation.mutate(product.id)}
                        className={`p-2.5 rounded-full transition-all group shadow-sm ${product.is_liked
                          ? 'bg-red-50 text-red-500'
                          : 'bg-gray-50 text-gray-400 hover:text-red-400 hover:bg-red-50'
                          }`}
                      >
                        <Heart
                          className={`w-6 h-6 transition-transform group-hover:scale-110 ${product.is_liked ? 'fill-current' : ''
                            }`}
                        />
                      </button>
                      <button
                        onClick={() => setIsLikersModalOpen(true)}
                        className="text-[10px] font-bold text-gray-400 hover:text-primary-600 transition-colors uppercase mt-1 tracking-wider"
                      >
                        {product.likes_count || 0} likes
                      </button>
                    </div>

                    <div className="flex flex-col items-center group/visit">
                      <button
                        onClick={() => setIsVisitorsModalOpen(true)}
                        className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 hover:text-primary-600 transition-all uppercase px-3 py-1.5 bg-gray-50 rounded-full hover:bg-primary-50 tracking-wider"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        {product.valid_visits_count || 0} visitas
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-4 mb-4">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-4 h-4 ${i < 4 ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`} />
                    ))}
                  </div>
                  <span className="text-sm text-gray-500">(24 reseñas)</span>
                </div>
              </div>

              {product.type === 'direct' ? (
                <div className="border-b pb-4">
                  <PriceFormatter price={product.price} className="text-3xl font-bold" />
                  <p className="text-sm text-gray-500 mt-1">
                    {product.stock > 0 ? `${product.stock} unidades disponibles` : 'Sin stock'}
                  </p>
                </div>
              ) : (
                <Card className="p-5 border-2 border-amber-200 bg-gradient-to-b from-amber-50 to-white">
                  <div className="text-center mb-4">
                    <p className="text-amber-600 font-semibold text-sm mb-1">Precio base de la puja</p>
                    <PriceFormatter price={auction?.starting_price} className="text-2xl font-bold text-gray-700" />
                    {auction && auction.current_price > auction.starting_price && (
                      <div className="mt-3">
                        <p className="text-gray-500 text-xs">Precio actual</p>
                        <PriceFormatter price={auction.current_price} className="text-4xl font-bold text-green-600" />
                      </div>
                    )}
                  </div>

                  {auction && !isAuctionEnded && (
                    <div className="mb-4">
                      <p className="text-xs text-gray-500 mb-2 text-center">Tiempo restante</p>
                      <div className="flex justify-center">
                        <CountdownTimer endDate={auction.ends_at} />
                      </div>
                    </div>
                  )}

                  {isAuctionEnded ? (
                    <div className="bg-gray-100 rounded-xl p-4">
                      <div className="text-center">
                        <span className="bg-red-100 text-red-700 px-4 py-1 rounded-full text-sm font-medium">
                          Subasta Finalizada
                        </span>
                      </div>
                      <div className="mt-3 space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Precio final:</span>
                          <span className="font-bold">${Number(auction.current_price).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                        </div>
                        {auction.winner?.user ? (
                          <>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600">Ganador:</span>
                              <span className="text-green-600 font-medium">{auction.winner.user.name}</span>
                            </div>
                            {user?.id === auction.winner_id && (
                              <div className="mt-4 pt-4 border-t border-gray-100">
                                <Button onClick={handleAddToCart} className="w-full bg-green-600 hover:bg-green-700">
                                  <ShoppingCart className="w-4 h-4 mr-2" />
                                  Agregar al Carrito
                                </Button>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="flex justify-between text-red-500 font-medium">
                            <span>Estado:</span>
                            <span>Sin ofertantes</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {isAuthenticated ? (
                        isOwner ? (
                          <div className="text-center py-3 bg-gray-100 rounded-xl">
                            <p className="text-gray-500 text-sm">No puedes ofertar en tu propia subasta</p>
                          </div>
                        ) : (
                          <>
                            <div className="flex flex-col gap-4">
                              <div className="flex items-center justify-between px-1">
                                <label className="flex items-center cursor-pointer gap-3 group">
                                  <div className="relative">
                                    <input
                                      type="checkbox"
                                      className="sr-only"
                                      checked={isAutoMode}
                                      onChange={() => setIsAutoMode(!isAutoMode)}
                                    />
                                    <div className={`block w-11 h-6 rounded-full transition-colors ${isAutoMode ? 'bg-primary-600' : 'bg-gray-300'}`}></div>
                                    <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ease-in-out ${isAutoMode ? 'translate-x-5' : ''}`}></div>
                                  </div>
                                  <span className="text-sm font-bold text-gray-700 group-hover:text-primary-600 transition-colors">
                                    Auto-Oferta 🤖
                                  </span>
                                </label>
                                {isAutoMode && (
                                  <span className="text-[10px] font-black text-primary-600 border border-primary-200 bg-primary-50 px-2 py-0.5 rounded-full uppercase tracking-tighter animate-pulse">
                                    Modo Inteligente
                                  </span>
                                )}
                              </div>

                              <div className="flex gap-2">
                                <input
                                  type="number"
                                  value={bidAmount}
                                  onChange={(e) => setBidAmount(e.target.value)}
                                  placeholder={isAutoMode ? "Tu Monto Máximo" : `Mínimo $${minBid.toLocaleString()}`}
                                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary-100 focus:border-primary-500 font-bold transition-all"
                                />
                                <Button onClick={handleBidding} loading={placeBidMutation.isPending || configureAutoBidMutation.isPending} className="px-8 shadow-lg shadow-primary-200">
                                  {isAutoMode ? 'ACTIVAR' : 'PUJAR'}
                                </Button>
                              </div>

                              {isAutoMode && (
                                <div className="p-3 bg-primary-50/50 rounded-xl border border-primary-100 animate-fade-in">
                                  <p className="text-[11px] text-primary-700 font-medium leading-relaxed italic">
                                    🚀 <strong>Smart Bid Activo:</strong> El sistema pujará por ti lo justo para ganar, hasta un máximo de <strong>${Number(bidAmount || 0).toLocaleString('es-AR')}</strong>.
                                  </p>
                                </div>
                              )}
                            </div>

                            {!userHasAutoBid ? null : (
                              <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                                <div className="flex items-center gap-3">
                                  <span className="text-2xl">🤖</span>
                                  <div>
                                    <p className="font-medium text-green-800">Auto-Oferta Activa</p>
                                    <p className="text-xs text-green-600">
                                      Tu oferta automática está participando en esta puja
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}

                            <p className="text-xs text-gray-500 text-center mt-2">
                              Incremento mínimo: ${minIncrement.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                            </p>
                          </>
                        )
                      ) : (
                        <div className="text-center py-4 bg-gray-50 rounded-xl">
                          <p className="text-gray-600 mb-2">¿Quieres participar?</p>
                          <Link to="/login">
                            <Button className="w-full">Iniciar sesión para ofertar</Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              )}

              {product.type === 'auction' && auction?.bids && auction.bids.length > 0 && (
                <Card className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">Participantes</h3>
                    <Badge variant="secondary">{auction.bids.length} ofertas</Badge>
                  </div>

                  {(() => {
                    const sortedByAmount = [...auction.bids].sort((a, b) => b.amount - a.amount);
                    const winner = sortedByAmount[0];
                    const uniqueUsers = [...new Set(auction.bids.map(b => b.user?.id))].filter(Boolean);

                    return (
                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-2 mb-4">
                          {uniqueUsers.map(userId => {
                            const userBid = auction.bids.find(b => b.user?.id === userId);
                            const isWinner = winner?.user?.id === userId;
                            const hasActiveAutoBid = isWinner && winner.is_auto_bid;
                            return (
                              <div
                                key={userId}
                                className={`flex items-center gap-2 px-3 py-2 rounded-xl ${isWinner ? 'bg-amber-100 border border-amber-300' : 'bg-gray-100'
                                  }`}
                              >
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isWinner ? 'bg-amber-500 text-white' : 'bg-gray-400 text-white'
                                  }`}>
                                  {userBid?.user?.name?.charAt(0).toUpperCase() || '?'}
                                </div>
                                <span className={`text-sm font-medium ${isWinner ? 'text-amber-800' : 'text-gray-700'}`}>
                                  {userBid?.user?.name || 'Usuario'}
                                </span>
                                {hasActiveAutoBid && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">🤖 Auto</span>}
                                {isWinner && <Trophy className="w-4 h-4 text-amber-500" />}
                              </div>
                            );
                          })}
                        </div>

                        <div className="border-t pt-4">
                          <p className="text-sm text-gray-500 mb-2">Historial de ofertas</p>
                          <div className="space-y-2">
                            {sortedByAmount.slice(0, 5).map((bid) => {
                              const isWinner = bid.id === winner?.id;
                              const { date, time } = formatDateTime(bid.created_at);

                              return (
                                <div
                                  key={bid.id}
                                  className={`flex items-center justify-between py-2 px-3 rounded-lg ${isWinner ? 'bg-amber-50 border border-amber-200' : 'bg-gray-50'
                                    }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${isWinner ? 'bg-amber-500 text-white' : 'bg-gray-300 text-gray-600'
                                      }`}>
                                      {bid.user?.name?.charAt(0).toUpperCase() || '?'}
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <p className={`text-sm font-medium ${isWinner ? 'text-amber-700' : 'text-gray-800'}`}>
                                          {bid.user?.name || 'Usuario'}
                                        </p>
                                        {(bid.is_auto_bid && isWinner) && <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">🤖 Auto</span>}
                                      </div>
                                      <p className="text-xs text-gray-400">{time}</p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <PriceFormatter price={bid.amount} className={isWinner ? 'text-amber-700 font-bold' : 'text-gray-700'} />
                                    {isWinner && <span className="text-xs text-amber-600 block">Liderando</span>}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {auction.bids.length > 5 && (
                          <button
                            onClick={() => setShowAllBids(true)}
                            className="w-full py-2 text-center text-primary-600 hover:text-primary-700 font-medium text-sm"
                          >
                            Ver todas las {auction.bids.length} ofertas <ChevronRight className="w-4 h-4 inline" />
                          </button>
                        )}
                      </div>
                    );
                  })()}
                </Card>
              )}

              {product.type === 'direct' && (
                <>
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="flex items-center border border-gray-200 rounded-xl">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="p-2 hover:bg-gray-50"
                        disabled={quantity <= 1}
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="px-4 font-medium text-sm">{quantity}</span>
                      <button
                        onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                        className="p-2 hover:bg-gray-50"
                        disabled={quantity >= product.stock}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 mb-6">
                    <Button onClick={handleAddToCart} className="w-full" disabled={product.stock === 0}>
                      <ShoppingCart className="w-5 h-5 mr-2" />
                      Agregar al Carrito
                    </Button>
                    <Button variant="outline" className="w-full">
                      <Heart className="w-5 h-5 mr-2" />
                      Agregar a Favoritos
                    </Button>
                  </div>
                </>
              )}

              <div className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-2xl p-4 space-y-3">
                <div className="flex items-center space-x-3">
                  <Truck className="w-5 h-5 text-primary-600" />
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Envío a todo el país</p>
                    <p className="text-xs text-gray-500">Calculado al finalizar compra</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Shield className="w-5 h-5 text-primary-600" />
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Compra 100% segura</p>
                    <p className="text-xs text-gray-500">Garantía de reembolso</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <RotateCcw className="w-5 h-5 text-primary-600" />
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Devolución en 30 días</p>
                    <p className="text-xs text-gray-500">Si no estás satisfecho</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-2xl p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <CreditCard className="w-5 h-5 text-gray-600" />
                  <span className="font-medium text-sm text-gray-900">Formas de pago</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="flex items-center gap-1 text-xs text-gray-600">
                    <CreditCard className="w-4 h-4" />
                    <span>Tarjeta</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-600">
                    <span>mercadopago</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-600">
                    <span>Efectivo</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-2xl p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <Package className="w-5 h-5 text-gray-600" />
                  <span className="font-medium text-sm text-gray-900">Información del vendedor</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-secondary-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
                    {product.user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{product.user?.name}</p>
                    <p className="text-xs text-gray-500">Miembro desde {new Date(product.user?.created_at).getFullYear()}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <button className="flex items-center gap-1 text-sm text-gray-600 hover:text-primary-600">
                  <Share2 className="w-4 h-4" />
                  Compartir
                </button>
                <div className="flex items-center gap-1 text-sm text-green-600">
                  <Check className="w-4 h-4" />
                  <span>Verificado</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <ImageCarouselModal
          images={images}
          initialIndex={selectedImage}
          onClose={() => setIsModalOpen(false)}
        />
      )}

      <Modal isOpen={showAllBids} onClose={() => setShowAllBids(false)} title={`Todas las Ofertas (${auction?.bids?.length || 0})`}>
        <div className="max-h-96 overflow-y-auto space-y-2">
          {[...(auction?.bids || [])]
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .map((bid, idx) => {
              const isWinner = idx === 0;
              const { date, time } = formatDateTime(bid.created_at);
              return (
                <div
                  key={bid.id}
                  className={`flex items-center justify-between py-3 px-4 rounded-xl ${isWinner ? 'bg-amber-50 border border-amber-200' : 'bg-gray-50'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isWinner ? 'bg-amber-500' : 'bg-gray-200'}`}>
                      {isWinner ? <Trophy className="w-5 h-5 text-white" /> : <span className="text-gray-600 font-medium">{bid.user?.name?.charAt(0).toUpperCase()}</span>}
                    </div>
                    <div>
                      <p className={`font-medium ${isWinner ? 'text-amber-700' : 'text-gray-900'}`}>{bid.user?.name || 'Usuario'}</p>
                      <p className="text-xs text-gray-500">{date} - {time}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <PriceFormatter price={bid.amount} className={isWinner ? 'text-amber-700 font-bold text-lg' : ''} />
                    {isWinner && <span className="text-xs text-amber-600 font-medium block">Ganador</span>}
                  </div>
                </div>
              );
            })}
        </div>
      </Modal>

      <LikersModal
        isOpen={isLikersModalOpen}
        onClose={() => setIsLikersModalOpen(false)}
        likers={likersData?.data?.likers || []}
        isLoading={isLoadingLikers}
      />

      <LikersModal
        isOpen={isVisitorsModalOpen}
        onClose={() => setIsVisitorsModalOpen(false)}
        likers={visitorsData?.data?.visitors || []}
        isLoading={isLoadingVisitors}
        title="Quienes visitaron este producto"
        emptyMessage="Aún no hay visitas válidas (5+ seg) registradas."
      />
    </Layout>
  );
}
